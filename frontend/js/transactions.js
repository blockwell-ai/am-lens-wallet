import axios from 'axios';
import $ from 'jquery';
import M from 'materialize-css';
import * as moment from 'moment';
import * as util from './util';

const weekAgo = moment().subtract(7, 'days');

function renderTransaction(txn) {
    let name = window.tokenName;
    let symbol = window.tokenSymbol;

    let m = moment(txn.created);
    let time;
    if (m.isBefore(weekAgo)) {
        time = m.format('MMM D, h:mm a');
    } else {
        time = m.fromNow(true);
    }

    let amount = '';
    if (txn.events && txn.events.length > 0 && txn.events[0].event === 'Transfer') {
        amount = util.toDecimals(txn.events[0].returnValues.value, window.tokenDecimals);
    }

    let $tx = $(`
<tr data-id="${txn.id}">
    <td class="hash">${txn.transactionHash}</td>
    <td class="age">${time}</td>
    <td class="from">${txn.from}</td>
    <td class="contract">${name}</td>
    <td class="method">${txn.method}</td>
    <td class="amount">${amount} <span>${symbol}</span></td>
</tr>`);


    $tx.on('click', (ev) => {
        window.location = `/app/transactions/${txn.id}`;
    });

    return $tx;
}

function renderTable(transactions) {
    const t = $('tbody.transactions');
    t.empty();

    t.append(transactions.map(renderTransaction));
}

export function init() {
    if ($('.transactions-list').length > 0) {
        axios.get(`/proxy/transactions`)
            .then(res => {
                renderTable(res.data.data);
            });
    }
}
