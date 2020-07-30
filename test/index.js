import 'regenerator-runtime/runtime';

import dirtyChai from 'dirty-chai';

global.chai.use(dirtyChai);

const testsContext = require.context('.', true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);

beforeEach(() => {
  /* eslint-disable no-console */
  sinon.stub(console, 'error').callsFake((message) => {
    let expected = false;

    console.error.expected.forEach((about) => {
      if (message.includes(about)) {
        console.error.warned[about] = true;
        expected = true;
      }
    });

    if (expected) {
      return;
    }

    console.error.threw = true;
    throw new Error(message);
  });

  console.error.expected = [];
  console.error.warned = Object.create(null);
  console.error.threw = false;
  /* eslint-enable no-console */
});

afterEach(() => {
  /* eslint-disable no-console */
  const { expected, warned, threw } = console.error;
  console.error.restore();

  if (!threw && expected.length) {
    expect(warned).to.have.keys(expected);
  }
  /* eslint-enable no-console */
});
