import axios from 'axios';
import $ from 'jquery';
import {renderTransaction} from "./transfers";

function renderTable(t, transfers) {
    t.empty();

    t.append(transfers.reverse().map(it => renderTransaction(it, it.symbol)));
}

export function init() {
    let address = window.location.pathname.split('/')[3];

    $('.address-title').text(address);

    if ($('.address-transfers').length > 0) {
        axios.get(`/proxy/tokens/${window.tokenId}/transfers?address=${address}`)
            .then((res) => {
                let transfers = res.data.data;
                transfers.forEach(it => it['symbol'] = window.tokenSymbol);
                transfers.sort((a, b) => a.blockNumber - b.blockNumber);
                renderTable($('.address-transfers tbody'), transfers);
            });
    }
}
