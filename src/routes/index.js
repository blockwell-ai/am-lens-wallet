const Router = require('koa-router');
const router = new Router();

router.use('/auth', require('am-lens/routes/auth').routes());
router.use('/app', require('./app').routes());
router.use('/proxy', require('am-lens/routes/proxy').routes());
router.use('/api', require('./api').routes());

router.get('/', async (ctx) => {
    if (ctx.state.user) {
        ctx.redirect('/app/wallet');
    } else {
        ctx.redirect('/auth/login');
    }
});

module.exports = router;
