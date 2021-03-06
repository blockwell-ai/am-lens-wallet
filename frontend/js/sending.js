import axios from 'axios';
import $ from 'jquery';
import M from 'materialize-css';
import * as moment from 'moment';
import {BigNumber} from 'bignumber.js';
import * as util from './util';

async function renderSecurityError(data, $tx) {
    const $status = $tx.find('.status');
    const amount = new BigNumber(data.parameters[1]);
    let res = await axios.get(`/proxy/tokens/${window.tokenId}/balances/${data.from}`);
    const balance = new BigNumber(res.data.data);

    if (amount.gt(balance)) {
        $status.text('Error: Token balance too low to send the given amount.');
        return;
    }

    res = await axios.get(`/proxy/contracts/${window.tokenId}/call/locksOf`, {
        params: {
            arg: data.from
        }
    });

    let {locks, locked} = util.parseLocks(res.data.data);

    const unlocked = balance.minus(locked);

    if (amount.gt(unlocked)) {
        let m = locks[0].time;
        let time;
        if (m.isAfter(util.inOneWeek)) {
            time = 'on ' + m.format('MMM D, Y');
        } else {
            time = m.fromNow();
        }
        let nextAmount = util.toDecimals(locks[0].amount, window.tokenDecimals);

        $status.text(`Error: Can't send tokens that are still locked. Your next unlock is ${time} for ${nextAmount} ${window.tokenSymbol}.`);
    }
}

function renderTransaction(req, res) {
    let id = res.id;
    let symbol = window.tokenSymbol;

    let $tx = $(`
<div class="transfer">
    <div class="transfer-id"></div>
    <div class="status"></div>
    <div><strong>From:</strong> <span class="transfer-from"></span></div>
    <div><strong>To:</strong> <span class="transfer-to"></span></div>
    <div><strong>Amount:</strong> <span class="transfer-amount"></span> <span class="transfer-symbol"></span></div>
    <div><span class="transfer-time"></span></div>
    <div class="progress">
        <div class="indeterminate"></div>
    </div>
</div>`);

    $('.current-transfers').prepend($tx);

    let $id = $tx.find('.transfer-id');
    let $status = $tx.find('.status');
    let $from = $tx.find('.transfer-from');
    let $to = $tx.find('.transfer-to');
    let $amount = $tx.find('.transfer-amount');
    let $time = $tx.find('.transfer-time');
    let $progress = $tx.find('.progress');
    $tx.find('.transfer-symbol').text(symbol);

    let update = (data) => {
        $id.text(data.id);
        $status.text(data.status);
        $from.text(data.from);
        $to.text(data.to);
        $amount.text(data.amount);
        $time.text(moment(data.created).format('h:mm:ss a'));
        if (data.ended) {
            $progress.addClass('hidden');
        }
        switch (data.status) {
            case 'completed':
                $status.addClass('completed');
                break;
            case 'error':
                $status.addClass('error');
                if (window.tokenType === 'erc20_security') {
                    renderSecurityError(data, $tx);
                }
                break;
        }
    };

    update(Object.assign(req, res));

    let interval = setInterval(() => {
        return axios.get(`/proxy/transactions/${id}`)
            .then(response => {
                let newRes = response.data.data;
                update(Object.assign(req, newRes));
                if (newRes.ended) {
                    clearInterval(interval);
                    return getAccounts();
                }
            })
            .catch(err => {
                alert(err.message);
            });
    }, 3000);

    $tx.get(0).scrollIntoView({
        behavior: 'smooth'
    });
}

function renderAccountOptions(accounts) {
    const s = $('select.account-selector');
    const s2 = document.querySelectorAll('select.account-selector');

    s.find('.account').remove();

    for (let account of accounts) {
        s.append(`<option class="account" value="${account.address}" ${account.defaultAccount ? ' selected ' : ''}>${account.address}</option>`);
    }

    M.FormSelect.init(s2);
    return s.trigger('change');
}

function getAccounts() {
    return axios.get('/proxy/accounts')
        .then(res => {
            return renderAccountOptions(res.data.data);
        });
}

function renderBalance(balance, selector, symbol) {
    $(selector).html(balance.toString() + ` <span>${symbol}</span>`);
}

function getBalance(account) {
    return axios.get(`/proxy/tokens/${window.tokenId}/balances/${account}`)
        .then(res => {
            renderBalance(util.toDecimals(res.data.data, window.tokenDecimals), '.token1-balance', window.tokenSymbol);
        });
}

async function submit(ev) {
    let $submit = $('#submit');
    $submit.attr('disabled', true);
    let data = {};
    new FormData(ev.target).forEach((v, k) => data[k] = v);

    if (!data.token) {
        M.toast({html: 'Select a Token Contract'});
        $submit.attr('disabled', false);
        return;
    }

    if ($('#email').hasClass('active')) {
        try {
            let res = await axios.get(`/api/user/${data.to_email}/address`);
            data.to = res.data.address;
        } catch (e) {
            M.toast({html: `No account found for email ${data.to_email}`});
            $submit.attr('disabled', false);
            return;
        }
    } else {
        data.to = data.to_account;
    }

    if (!data.to) {
        M.toast({html: 'Enter a recipient email or account address'});
        $submit.attr('disabled', false);
        return;
    }

    if (!data.from) {
        M.toast({html: 'No From Account selected'});
        $submit.attr('disabled', false);
        return;
    }

    let body = {
        from: data.from,
        to: data.to,
        value: util.toInteger(data.amount, window.tokenDecimals)
    };

    let url = `/proxy/tokens/${data.token}/transfers`;

    // Security Tokens locked transfer
    if (window.tokenType === 'erc20_security' && data.locked) {
        url = `/proxy/contracts/${data.token}/send/transferAndLock`;
        body = {
            from: data.from,
            arg: [
                data.to,
                util.toInteger(data.amount, window.tokenDecimals)
            ]
        }
    }

    axios.post(url, body)
        .then(res => {
            renderTransaction(data, res.data.data);
            $('#amount').val('');
            $submit.attr('disabled', false);
        })
        .tapCatch(err => {
            $submit.attr('disabled', false);
        });
}

export function init() {
    if ($('.wallet-send').length > 0) {
        getAccounts();

        $('.account-selector').on('change', (it) => {
            getBalance(it.target.value);
        });
    }

    $('#to-account').hide();
    $('.to-account-selector span').click(ev => {
        let selected = $(ev.target);
        $('.to-account-selector span').removeClass('active');
        selected.addClass('active');
        if (selected.text() === 'wallet') {
            $('#to-email').hide();
            $('#to-account').show();
        } else {
            $('#to-account').hide();
            $('#to-email').show();
        }
    });

    $('.token-send-form').on('submit', (ev) => {
        ev.preventDefault();
        submit(ev).catch(err => {
            M.toast({html: 'Unknown error, sending failed'});
            console.log(err);
        });
    });

    $('.test-account').click(ev => {
        let email = $(ev.currentTarget).find('.email').text();
        let address = $(ev.currentTarget).find('.address').text();
        $('#to-account').val(address);
        $('#to-email').val(email);
        $('.to-account-label').get(0).scrollIntoView({
            behavior: 'smooth'
        });
    });

    if (window.tokenType === 'erc20_security') {
        axios.get(`/proxy/contracts/${window.tokenId}/call/lockTime`)
            .then(res => {
                let time = moment().add(parseInt(res.data.data), 'seconds');
                $('.lock-expiration').text(time.fromNow(true));
            });
    }
}
