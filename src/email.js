const conf = require('am-lens/config');
const SparkPost = require('sparkpost');
const client = new SparkPost(conf.get('sparkpost_key'));

/**
 * Send a welcome email to a new recipient not yet in the system.
 *
 * @param {Object} sender
 * @param {Object} recipient
 * @param {String} url
 * @param {String} password
 * @return {Promise}
 */
function sendWelcome(sender, recipient, url, password) {
    return client.transmissions.send({
        recipients: [
            {address: {email: recipient.email}}
        ],
        content: {
            template_id: 'lens-welcome'
        },
        substitution_data: {
            sender: sender.email,
            recipient: recipient.email,
            symbol: conf.get('token_symbol'),
            url: url,
            password: password,
            account: recipient.data.address
        }
    });
}

module.exports = {
    sendWelcome
};
