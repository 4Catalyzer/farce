import queryString from 'query-string';

import createQueryMiddleware from './createQueryMiddleware';

export default createQueryMiddleware(queryString);
