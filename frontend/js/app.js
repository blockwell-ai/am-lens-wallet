import * as Promise from 'bluebird';
import "@babel/polyfill";
import $ from 'cash-dom';
import M from 'materialize-css';
import * as ClipboardJS from 'clipboard';

import * as wallet from './wallet';
import * as sending from './sending';
import * as transactions from './transactions';
import * as transaction from './transaction';
import * as transfers from './transfers';
import * as addressTransfers from './transfers-address';

if (window) {
    window.Promise = Promise;
}

$(document).ready(() => {
    var elems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elems, {isFixed: true});

    $('#slide-out > li > a').each((index, it) => {
        if (it.href.endsWith(window.location.pathname)) {
            $(it).parent().addClass('active');
        }
    });

    wallet.init();
    sending.init();
    transactions.init();
    transaction.init();
    transfers.init();
    addressTransfers.init();

    if (window.flashMessage) {
        M.toast({html: window.flashMessage});
    }

    M.Dropdown.init(document.querySelectorAll('.user-dropdown'), {
        alignment: 'right',
        coverTrigger: false,
        constrainWidth: false
    });

    let clipboard = new ClipboardJS('.clipboard', {
        text: function(trigger) {
            return $(trigger).text();
        }
    });
    clipboard.on('success', function(e) {
        let name = $(e.trigger).data('clipboard-name');
        M.toast({html: `Copied ${name} to clipboard`});
    });

    M.AutoInit();
});

