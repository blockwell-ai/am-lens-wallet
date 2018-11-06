import axios from 'axios';
import $ from 'cash-dom';
import M from 'materialize-css';
import * as util from './util';
import {BigNumber} from 'bignumber.js';

function renderAccounts(accounts) {
    const t = $('tbody.accounts');
    t.empty();

    for (let account of accounts) {
        t.append(`<tr>
    <td class="address"><a href="/app/transfers/${account.address}">${account.address}</a></td>
    <td class="default">${account.defaultAccount ? '<i class="material-icons">check_circle</i>' : ''}</td>
</tr>`);
    }
}

function renderAccountOptions(accounts) {
    const s = $('select.account-selector');
    const s2 = document.querySelectorAll('select.account-selector');

    s.find('.account').remove();

    for (let account of accounts) {
        s.append(`<option class="account" value="${account.address}" ${account.defaultAccount ? ' selected ' : ''}>${account.address}</option>`);
    }

    M.FormSelect.init(s2);
    s.trigger('change');
}

function getAccounts() {
    axios.get('/proxy/accounts')
        .then(res => {
            renderAccounts(res.data.data);
            renderAccountOptions(res.data.data);
        });
}

function renderBalance(context, balance, selector, symbol) {
    context.find(selector).html(util.renderAmount(balance));
}

function getBalances(context, account) {
    if (window.tokenType === 'erc20_security') {
        Promise.all([
            axios.get(`/proxy/tokens/${window.tokenId}/balances/${account}`),
            axios.get(`/proxy/contracts/${window.tokenId}/call/locksOf`, {params: {arg: account}})
        ]).then(res => {
            let balance = new BigNumber(res[0].data.data);
            let {locks, locked} = util.parseLocks(res[1].data.data);
            let unlocked = balance.minus(locked);

            let lockRows = locks.map(it => {
                return `
                    <tr>
                        <td>${it.time.format('lll')}</td>
                        <td class="lock-amount">${util.renderAmount(it.amount)}</td>
                    </tr>
                `;
            }).join('');

            $('.token1-details').html(`
                <div class="label">Locked</div>
                <div class="label">Total Available</div>
                <div class="label"><a href="#" class="dropdown-trigger show-locks" data-target="locks1">Show Locks</a></div>
                <div class="dropdown-content" id="locks1">
                    <table>
                        <thead>
                        <tr>
                            <th>Unlock Time</th>
                            <th class="lock-amount">Amount</th>
                        </tr>
                        </thead>
                        <tbody class="accounts">
                            ${lockRows}
                        </tbody>
                    </table>
                </div>
             `);

            M.Dropdown.init($('.token1-details .dropdown-trigger')[0], {constrainWidth: false});

            $('.token1-balance').html(`
                ${util.renderAmount(balance)}
                <div class="locked">${util.renderAmount(locked)}</div>
                <div class="available">${util.renderAmount(unlocked)}</div>
            `);
        });
    } else {
        axios.get(`/proxy/tokens/${window.tokenId}/balances/${account}`)
            .then(res => {
                renderBalance(context, res.data.data, '.token1-balance', window.tokenSymbol);
            });
    }
}

export function init() {
    if ($('.wallet-addresses').length > 0) {
        getAccounts();
    }

    if ($('.wallet-balances').length > 0) {
        $('.wallet-balances .account-selector').on('change', (it) => {
            const select = $(it.srcElement);
            const context = select.parents('.wallet-balances');
            context.find('td.balance').text('...');

            getBalances(context, select.val());
        });
    }
}
