import './bot';

import { init } from '@amplitude/analytics-node';
import dotenv from 'dotenv';

dotenv.config();

init(process.env.AMPLITUDE_API_KEY ?? '');
