import dotenv from 'dotenv';
dotenv.config();

import { instagramHandler } from './clients/instagram';
import { webHandler } from './clients/web';


(async () => {

    webHandler();
    instagramHandler();

})();