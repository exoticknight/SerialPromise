import test from 'tape'
import QueuePromise, { StatusCode } from '../src/index'

function generatePromise(isRes, timeout) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      if (isRes) {
        res('resolve')
      } else {
        rej('reject')
      }
    }, timeout)
  })
}

test('normal queue', async function(t) {
  const rets = await QueuePromise(
    [
      () => {
        return generatePromise(true, 1000)
      },
      () => {
        return generatePromise(false, 1000)
      }
    ],
    [2000, 2000],
    500,
    x => {console.log(x)}
  )

  t.equal(rets[0].status, StatusCode.RESOLVE, 'should resovle')
  t.equal(rets[1].status, StatusCode.REJECT, 'should reject')

  t.end()
})

test('timeout queue', async function(t) {
  const rets = await QueuePromise(
    [
      () => {
        return generatePromise(true, 2000)
      },

      () => {
        return generatePromise(false, 2000)
      }
    ],
    [1000, 1000],
    500,
    () => {}
  )

  t.equal(rets[0].status, StatusCode.TIMEOUT, 'should timeout')
  t.equal(rets[1].status, StatusCode.TIMEOUT, 'should timeout')

  t.end()
})

test('pass status', async function(t) {
  const rets = await QueuePromise(
    [
      r => {
        t.equal(r, null, 'null for the first time')
        return generatePromise(true, 500)
      },
      r => {
        t.deepEqual(r, { status: StatusCode.RESOLVE, data: 'resolve' }, 'pass resolve')
        return generatePromise(false, 500)
      },
      r => {
        t.deepEqual(r, { status: StatusCode.REJECT, error: 'reject' }, 'pass reject')
        return generatePromise(false, 2000)
      },
      r => {
        t.deepEqual(r, { status: StatusCode.TIMEOUT, timeout: 1000 }, 'pass timeout')
        return generatePromise(true, 500)
      }
    ],
    [1000, 1000, 1000,],
    500,
    () => {}
  )

  t.deepEqual(rets[rets.length-1], { status: StatusCode.RESOLVE, data: 'resolve' }, 'pass anyway')

  t.end()
})

test('onPrpgress', async function(t) {
  const sequence = []
  await QueuePromise(
    [
      () => {
        return generatePromise(true, 500)
      },
      () => {
        return generatePromise(false, 500)
      },
      () => {
        return generatePromise(false, 2000)
      },
    ],
    [1000, 1000, 1000],
    500,
    progress => {
      sequence.push(progress)
    }
  )

  t.deepEqual(sequence[0], {
    total: 3,
    resolve: [0],
    reject: [],
    timeout: []
  })
  t.deepEqual(sequence[1], {
    total: 3,
    resolve: [0],
    reject: [1],
    timeout: []
  })
  t.deepEqual(sequence[2], {
    total: 3,
    resolve: [0],
    reject: [1],
    timeout: [2]
  })

  t.end()
})

test('get all results', async function(t) {
  const rets = await QueuePromise(
    [
      () => {
        return generatePromise(true, 500)
      },
      () => {
        return generatePromise(false, 500)
      },
      () => {
        return generatePromise(false, 2000)
      },
    ],
    [1000, 1000, 1000],
    500,
    () => {}
  )

  t.deepEqual(rets[0], { status: StatusCode.RESOLVE, data: 'resolve' }, 'should get resolve data')
  t.deepEqual(rets[1], { status: StatusCode.REJECT, error: 'reject' }, 'should get reject error')
  t.deepEqual(rets[2], { status: StatusCode.TIMEOUT, timeout: 1000 }, 'should get timeout')

  t.end()
})