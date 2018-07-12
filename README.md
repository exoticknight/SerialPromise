# SerialPromise

run promises with timeout, in queue

> you can alse check [parallel-promise](https://www.npmjs.com/package/parallel-promise)

## Install

```bash
npm install queue-promise --save
```

## Usage

```javascript
import SerialPromise, { StatusCode } from 'serial-promise'

SerialPromise(
  [
    lastResult => {
      // lastResult equals null at first
      // return a promise that resolves in 100ms
    },
    lastResult => {
      // lastResult equals { status: StatusCode.RESOLVE, data:[your data] }
      // return a promise that resolves in 3000ms
    },
    lastResult => {
      // lastResult equals { status: StatusCode.TIMEOUT, timeout: 2000 }
      // return a promise that rejects in 100ms
    },
    lastResult => {
      // lastResult equals { status: StatusCode.REJECT, err:[error] }
      // return a promise that rejects in 3000ms
    },
  ],
  [1000, 2000, 1000, 2000],  // timeout for each promise, no timeout if undefined
  500,  // time delay between each promise, you can even use [500, 1000, 3000] to control
  (progress) => {
    // called whenever a promise's state is changed
    // progress == {
    //   total: 4,  total count of promise
    //   resolve: [],  array of the index of the resolved promises
    //   reject: [],  array of the index of the rejected promises
    //   timeout: [],  array of the index of the timeouted promise
    // }
  }
).then(rets => {
  // rets == [
  //   { status: StatusCode.RESOLVE, data:[your data] },
  //   { status: StatusCode.TIMEOUT, timeout: 2000 }
  //   { status: StatusCode.REJECT, err:[error] },
  //   { status: StatusCode.TIMEOUT, timeout: 2000 }
  // ]
})// NOTE that there is not .catch here
```

You can use async/await as well.

## StatusCode

| Status | StatusCode |
|---|---|
| RESOLVE | 0 |
| REJECT | 1 |
| TIMEOUT | -1 |

## Test

```bash
npm run test
```

## License

MIT