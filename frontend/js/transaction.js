import axios from 'axios';
import $ from 'jquery';
import M from 'materialize-css';
import * as moment from 'moment';
import * as util from './util';

const weekAgo = moment().subtract(7, 'days');

function renderTransaction(txn) {
    let name = window.tokenName;
    let symbol = window.tokenSymbol;

    let time = moment(txn.created).format('MMM D YYYY, h:mm a');

    $('.transaction-hash').text(txn.transactionHash);
    $('.value-timestamp').text(time);
    $('.value-from').text(txn.from);
    $('.value-contract').text(name);
    $('.value-function').text(txn.method);
    $('.value-parameters').html(txn.parameters.join('<br>'));

    if (txn.events && txn.events.length > 0) {
        $('.events-wrapper').append(txn.events.map(it => {
            let values = Object.entries(it.returnValues).map(([key, val]) => {
                let value = val;
                if (key === 'value') {
                    let converted = util.toDecimals(txn.events[0].returnValues.value, window.tokenDecimals);
                    value = `${val}<br>= ${converted} ${symbol}`;
                }
                return `
                    <div class="info-row">
                        <span class="label">${key}</span>
                        <span class="value clipboard" data-clipboard-name="${key}">${value}</span>
                    </div>`
            }).join('');

            return $(`
                <h4>${it.event}</h4>
                <div class="info-table">
                    ${values}
                </div>
            `)
        }));
    }
}

export function init() {
    if ($('.transaction').length > 0) {
        let id = window.location.pathname.split('/')[3];
        if (id) {
            axios.get(`/proxy/transactions/${id}`)
                .then(res => {
                    renderTransaction(res.data.data);
                });
        }
    }
}
