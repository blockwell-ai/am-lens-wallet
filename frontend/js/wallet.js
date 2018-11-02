import axios from 'axios';
import $ from 'cash-dom';
import M from 'materialize-css';
import * as util from './util';

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
    context.find(selector).html(balance.toString() + ` <span>${symbol}</span>`);
}

function getBalances(context, account) {
    axios.get(`/proxy/tokens/${window.tokenId}/balances/${account}`)
        .then(res => {
            renderBalance(context, util.toDecimals(res.data.data, window.tokenDecimals), '.token1-balance', window.tokenSymbol);
        });
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
