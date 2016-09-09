import 'babel-polyfill';

import chai from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

const testsContext = require.context('.', true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);
