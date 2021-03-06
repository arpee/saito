var saito            = exports;


// Core Code
saito.archives       = require('./saito/archives');
saito.block          = require('./saito/block');
saito.blockchain     = require('./saito/blockchain');
saito.browser        = require('./saito/browser');
saito.crypt          = require('./saito/crypt');
saito.dns            = require('./saito/dns');
saito.goldenticket   = require('./saito/goldenticket');
saito.key            = require('./saito/key');
saito.keys           = require('./saito/keys');
saito.logger         = require('./saito/logger');
saito.miner          = require('./saito/miner');
saito.monitor        = require('./saito/monitor');
saito.mempool        = require('./saito/mempool');
saito.network        = require('./saito/network');
saito.path           = require('./saito/path');
saito.peer           = require('./saito/peer');
saito.server         = require('./saito/server');
saito.slip           = require('./saito/slip');
saito.storage        = require('./saito/storage');
saito.transaction    = require('./saito/transaction');
saito.voter          = require('./saito/voter');
saito.wallet         = require('./saito/wallet');

// Templates
saito.templates      = {};
saito.templates.desktopSettings = require('./saito/web/templates/desktop-settings');
saito.templates.mobileSettings = require('./saito/web/templates/mobile-settings');



