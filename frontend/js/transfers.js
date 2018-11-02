import axios from 'axios';
import $ from 'jquery';
import * as util from './util';

export function renderTransaction(transfer, symbol) {
    return $(`
<tr data-id="${transfer.id}">
    <td class="block">
        <span class="label">Block</span>
        <span class="value">${transfer.blockNumber}</span>
    </td>
    <td class="from">
        <span class="label">From</span>
        <span class="value"><a href="/app/transfers/${transfer.from}">${transfer.from}</a></span>
    </td>
    <td class="to">
        <span class="label">To</span>
        <span class="value"><a href="/app/transfers/${transfer.to}">${transfer.to}</a></span>
    </td>
    <td class="amount">
        <span class="label">Amount</span>
        <span class="value">${util.toDecimals(transfer.value, window.tokenDecimals)} <span>${symbol}</span></span>
    </td>
</tr>`);
}

function renderTable(t, transactions, symbol) {
    t.empty();

    t.append(transactions.reverse().map(it => renderTransaction(it, symbol)));
}

export function init() {
    if ($('.transfers-list').length > 0) {
        axios.get(`/proxy/tokens/${window.tokenId}/transfers`)
            .then(res => {
                renderTable($('.transfers-list tbody'), res.data.data, window.tokenSymbol);
            });
    }
}
