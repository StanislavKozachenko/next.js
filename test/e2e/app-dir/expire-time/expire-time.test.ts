import { nextTestSetup } from 'e2e-utils'

describe('expire-time', () => {
  const { next, isNextDeploy } = nextTestSetup({
    files: __dirname,
  })

  // On Vercel, ISR cache decisions happen at the Proxy layer. The Vercel
  // builder reads the route's `expire` value (Next.js's `initialExpireSeconds`
  // in the prerender manifest, which the build derives from `expireTime` when
  // no explicit `cacheLife` expire is set) and passes it to the Proxy as
  // `staleExpiration`. The Proxy is also expected, once implemented, to read
  // updated values from Next.js's `stale-while-revalidate` response header on
  // subsequent revalidations. Today the Proxy ignores the expire value entirely
  // and treats it as one year. Past `expireTime` it serves stale with a
  // background revalidation instead of a blocking prerender. When Proxy is
  // updated to honor the expire value, this test will start passing in deploy
  // mode and `it.failing` will itself fail. That's the signal to flip it back
  // to `it`.
  const itFailsWhenDeployed = isNextDeploy ? it.failing : it

  /* eslint-disable jest/no-standalone-expect */
  itFailsWhenDeployed(
    'should do a blocking revalidation when the cache entry has expired',
    async () => {
      const $first = await next.render$('/')
      const v0 = $first('#value').text()
      expect(v0).toBeTruthy()

      // Wait past `expireTime` (2 s). The next request must trigger a
      // blocking re-render, not stale-while-revalidate — so the response
      // returned right here carries a freshly-computed value, not the
      // prerendered one.
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const $second = await next.render$('/')
      const v1 = $second('#value').text()

      expect(v1).not.toBe(v0)
    }
  )
  /* eslint-enable jest/no-standalone-expect */
})
