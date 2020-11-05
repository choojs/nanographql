const tape = require('tape')
const querystring = require('querystring')
const { gql, nanographql, Operation } = require('./')

tape('operation interface', function (t) {
  t.plan(5)
  const expected = {
    operationName: 'Greeting',
    variables: { hello: 'world' },
    query: 'query Greeting { hello }'
  }
  const operation = new Operation({ ...expected, key: 'hi' })

  t.equal(operation.toString(), [
    `query=${encodeURIComponent('query Greeting { hello }')}`,
    `variables=${encodeURIComponent('{"hello":"world"}')}`,
    'operationName=Greeting'
  ].join('&'), 'string representation as query string')
  t.deepEqual(operation.toJSON(), expected, 'json representation match')

  for (const [key, value] of operation) {
    t.equal(value, expected[key], `iterator expose ${key}`)
  }

  t.end()
})

tape('should resolve to operation', function (t) {
  const query = gql`
    {
      hello
    }
  `
  t.equal(typeof query, 'function', 'is function')
  t.doesNotThrow(query, 'does not throw')

  const operation = query({ value: 1 })
  t.ok(operation instanceof Operation, 'resolves to Operation')
  t.deepEqual(operation.variables, { value: 1 }, 'operation has variables')
  t.equal(operation.query, `
    {
      hello
    }
  `, 'operation has query')
  t.end()
})

tape('should expose operations by type', function (t) {
  const { query, mutation, subscription } = gql`
    query {
      hello {
        name
      }
    }
    mutation {
      greet(name: $name) {
        name
      }
    }
    subscription {
      friendship(name: $name) {
        relation
      }
    }
  `

  t.equal(typeof query, 'function', 'query is exposed')
  t.equal(typeof mutation, 'function', 'mutation is exposed')
  t.equal(typeof subscription, 'function', 'subscription is exposed')

  const operation = mutation({ name: 'Jane Doe' })
  t.ok(operation instanceof Operation, 'mutation resolves to Operation')
  t.equal(operation.query.trim(), `
    mutation {
      greet(name: $name) {
        name
      }
    }
  `.trim(), 'mutation has query')

  t.end()
})

tape('should expose named operations', function (t) {
  const query = gql`
    query Introduction {
      hello {
        name
      }
    }
    mutation Handshake($name: String!) {
      greet(name: $name) {
        ...person
      }
    }
    subscription Friendship($name: String!) {
      friendship(name: $name) {
        relation
        person {
          ...person
        }
      }
    }
    fragment person on Friend {
      name
    }
  `

  t.equal(typeof query.Introduction, 'function', 'Introduction is exposed')
  t.equal(typeof query.Handshake, 'function', 'Handshake is exposed')
  t.equal(typeof query.Friendship, 'function', 'Friendship is exposed')
  t.equal(typeof query.person, 'function', 'fragment is exposed')

  const introduction = query.Introduction()
  t.ok(introduction instanceof Operation, 'introduction resolves to Operation')
  t.equal(introduction.query.trim(), `
    query Introduction {
      hello {
        name
      }
    }
  `.trim(), 'introduction has query')

  const handshake = query.Handshake({ name: 'Jane Doe' })
  t.deepEqual(handshake.variables, { name: 'Jane Doe' }, 'handshake has variables')
  t.equal(handshake.query.trim(), `
    mutation Handshake($name: String!) {
      greet(name: $name) {
        ...person
      }
    }
    fragment person on Friend {
      name
    }
  `.trim(), 'handshake has fragment')

  t.end()
})

tape('should support expressions', function (t) {
  const { person } = gql`
    fragment person on Person {
      name
    }
  `
  const { GetPerson, GetPeople, UpdatePerson } = gql`
    query GetPerson {
      getPerson(name: "${'Jane Doe'}") {
        name
      }
    }
    query GetPeople {
      getPeople {
        ...${person}
      }
    }
    mutation UpdatePerson {
      updatePerson(name: "${(variables) => variables.name}") {
        name
      }
    }
  `

  let operation = GetPerson()
  t.equal(operation.query.trim(), `
    query GetPerson {
      getPerson(name: "Jane Doe") {
        name
      }
    }
  `.trim(), 'interpolates string expressions')

  operation = GetPeople()
  t.equal(operation.query.trim(), `
    query GetPeople {
      getPeople {
        ...person
      }
    }
    fragment person on Person {
      name
    }
  `.trim(), 'interpolates fragment operation')

  operation = UpdatePerson({ name: 'Jane Doe' })
  t.equal(operation.query.trim(), `
    mutation UpdatePerson {
      updatePerson(name: "Jane Doe") {
        name
      }
    }
  `.trim(), 'interpolates function expressions')

  t.end()
})

tape('fetch handler', function (t) {
  t.test('with query', function (t) {
    t.plan(7)

    const graphql = nanographql('/graphql', { fetch })
    const { Query } = gql`
      query Query {
        hello
      }
    `

    let shouldFail = true
    graphql(Query({ hello: 'world' }), function (err, res) {
      t.ok(err, 'callback received error')
    })

    shouldFail = false
    graphql(Query({ hello: 'world' }), function (err, res) {
      t.notOk(err)
      t.deepEqual(res, { data: { hello: 'hi!' } }, 'callback received data')
    })

    function fetch (url, opts, cb) {
      t.equal(url, '/graphql?query=query%20Query%20%7B%20hello%20%7D&variables=%7B%22hello%22%3A%22world%22%7D&operationName=Query', 'payload is encoded as query string')
      t.equal(typeof cb, 'function', 'forwards callback')
      if (shouldFail) cb(new Error('fail'))
      else cb(null, { data: { hello: 'hi!' } })
    }
  })

  t.test('with large query', function (t) {
    t.plan(4)

    const graphql = nanographql('/graphql', { fetch })
    const { Query } = gql`
      query Query {
        hello
      }
    `

    const variables = { value: '' }
    for (let i = 0; i < 2000; i++) variables.value += 'a'
    const operation = Query(variables)
    graphql(operation)

    function fetch (url, opts, cb) {
      t.ok(opts.body, 'body is set')
      const body = JSON.parse(opts.body)
      t.deepEqual(body, operation.toJSON(), 'operation is encoded as json body')
      t.equal(opts.headers?.['Content-Type'], 'application/json', 'header is set to json')
      t.equal(opts.method, 'POST', 'method is POST')
      cb(null)
    }
  })

  t.test('with mutation', function (t) {
    t.plan(6)

    const graphql = nanographql('/graphql', { fetch })
    const { Mutation } = gql`
      mutation Mutation {
        hello
      }
    `

    const operation = Mutation({ hello: 'world' })
    graphql(operation, function (err, res) {
      t.notOk(err)
    })

    function fetch (url, opts, cb) {
      t.ok(opts.body, 'body is set')
      const body = JSON.parse(opts.body)
      t.equal(url, '/graphql', 'url is untouched')
      t.deepEqual(body, operation.toJSON(), 'payload is json encoded')
      t.equal(opts.headers?.['Content-Type'], 'application/json', 'header is set to json')
      t.equal(opts.method, 'POST', 'method is POST')
      cb(null)
    }
  })

  t.test('with body', function (t) {
    t.plan(4)

    const graphql = nanographql('/graphql', { fetch })
    const { Mutation } = gql`
      mutation Mutation {
        hello
      }
    `

    const method = 'UPDATE'
    const body = 'hello=world'
    const contentType = 'application/x-www-form-urlencoded'
    const operation = Mutation({ hello: 'world' })
    graphql(operation, {
      body,
      method,
      headers: { 'Content-Type': contentType }
    }, function (err, res) {
      t.notOk(err)
    })

    function fetch (url, opts, cb) {
      t.equal(opts.body, body, 'body is preserved')
      t.equal(opts.headers?.['Content-Type'], contentType, 'content type is preserved')
      t.equal(opts.method, method, 'method is preserved')
      cb(null)
    }
  })

  t.test('synchronous resolution', function (t) {
    t.plan(4)

    const graphql = nanographql('/graphql', { fetch })
    const { Query } = gql`
      query Query {
        hello
      }
    `

    let shouldFail = true
    let res = graphql(Query({ hello: 'world' }), function (err, res) {
      t.ok(err, 'callback received error')
    })
    t.deepEqual(res, {}, 'resolves to empty object on error')

    shouldFail = false
    res = graphql(Query({ hello: 'world' }), function (err, res) {
      t.notOk(err)
    })
    t.deepEqual(res, { data: { hello: 'hi!' } }, 'synchronously resolved result')

    function fetch (url, opts, cb) {
      if (shouldFail) cb(new Error('fail'))
      else cb(null, { data: { hello: 'hi!' } })
    }
  })

  t.test('asynchronous resolution', function (t) {
    t.plan(3)

    const graphql = nanographql('/graphql', { fetch })
    const { Query } = gql`
      query Query {
        hello
      }
    `

    let shouldFail = true
    const sequence = init()
    sequence.next()

    function * init () {
      let res = graphql(Query({ hello: 'world' }))
      t.deepEqual(res, {}, 'resolves to empty object while loading')
      yield
      shouldFail = false
      res = graphql(Query({ hello: 'world' }))
      t.deepEqual(res, {}, 'resolves to empty object while loading after error')
      yield
      res = graphql(Query({ hello: 'world' }))
      t.deepEqual(res, { data: { hello: 'hi!' } }, 'resolved result')
    }

    function fetch (url, opts, cb) {
      setTimeout(function () {
        if (shouldFail) cb(new Error('fail'))
        else cb(null, { data: { hello: 'hi!' } })
        sequence.next()
      }, 100)
    }
  })
})

tape('cache handler', function (t) {
  t.test('cache by query', function (t) {
    t.plan(3)

    const graphql = nanographql('/graphql', { fetch })
    const { Query } = gql`
      query Query {
        hello
      }
    `

    let shouldFail = true
    const sequence = init()
    sequence.next()

    function * init () {
      let res = graphql(Query())
      t.deepEqual(res, {}, 'resolves to empty result while loading')
      yield
      shouldFail = false
      res = graphql(Query())
      t.deepEqual(res, {}, 'error was not cached')
      yield
      res = graphql(Query())
      t.deepEqual(res, { data: { hello: 'world' } }, 'result was cached')
    }

    function fetch (url, opts, cb) {
      setTimeout(function () {
        if (shouldFail) cb(new Error('fail'))
        else cb(null, { data: { hello: 'world' } })
        sequence.next()
      }, 100)
    }
  })

  t.test('cache by variables', function (t) {
    t.plan(4)

    const graphql = nanographql('/graphql', { fetch })
    const { Query } = gql`
      query Query($value: String!) {
        echo(value: $value)
      }
    `

    const sequence = init()
    sequence.next()

    function * init () {
      let foo = graphql(Query({ value: 'foo' }))
      t.deepEqual(foo, {}, 'resolves to empty result while loading')
      yield
      let bar = graphql(Query({ value: 'bar' }))
      t.deepEqual(bar, {}, 'resolves to empty result while loading')
      yield
      foo = graphql(Query({ value: 'foo' }))
      t.deepEqual(foo, { data: { echo: { value: 'foo' } } }, 'result was cached by foo value')
      bar = graphql(Query({ value: 'bar' }))
      t.deepEqual(bar, { data: { echo: { value: 'bar' } } }, 'result was cached by bar value')
    }

    function fetch (url, opts, cb) {
      setTimeout(function () {
        const query = querystring.parse(url.split('?')[1])
        cb(null, { data: { echo: JSON.parse(query.variables) } })
        sequence.next()
      }, 100)
    }
  })

  t.test('cache by key option', function (t) {
    t.plan(8)

    const graphql = nanographql('/graphql', { fetch })
    const { Query, Mutation } = gql`
      query Query($value: String!) {
        key(value: $value)
      }
      mutation Mutation($value: String!) {
        key(value: $value)
      }
    `

    const sequence = init()
    sequence.next()

    function * init () {
      let foo = graphql(Query({ value: 'foo' }), { key: keyFn })
      t.deepEqual(foo, {}, 'resolves to empty result while loading')
      yield
      graphql(Mutation({ value: 'bin' }, {
        key (res) {
          return res?.data.key
        }
      }))
      let bar = graphql(Query({ value: 'bar' }), { key: 'baz' })
      t.deepEqual(bar, { data: { key: 'baz' } }, 'mutation resolved to same key')
      yield
      foo = graphql(Query({ value: 'foo' }), { key: keyFn })
      bar = graphql(Query({ value: 'bar' }), { key: 'baz' })
      t.deepEqual(foo, { data: { key: 'baz' } }, 'result match')
      t.deepEqual(bar, { data: { key: 'baz' } }, 'result match')
    }

    function fetch (url, opts, cb) {
      setTimeout(function () {
        cb(null, { data: { key: 'baz' } })
        sequence.next()
      }, 100)
    }

    function keyFn (variables, cached) {
      t.deepEqual(variables, { value: 'foo' }, 'key function called w/ variables')
      if (cached) {
        t.deepEqual(cached, { data: { key: 'baz' } }, 'key function called w/ cached value')
      }
      return 'baz'
    }
  })

  t.test('respect only-if-cached option', function (t) {
    const graphql = nanographql('/graphql', { fetch })
    const { Query } = gql`
      query Query {
        hello
      }
    `

    const res = graphql(Query(), { cache: 'only-if-cached' })
    t.deepEqual(res, {}, 'empty result when not cached')
    t.end()

    function fetch (url, opts, cb) {
      t.fail('should not fetch')
    }
  })

  t.test('respect cache bypass option', function (t) {
    t.plan(12)

    const graphql = nanographql('/graphql', { fetch })
    const { Query } = gql`
      query Query {
        hello
      }
    `

    const bypass = ['no-store', 'reload', 'no-cache', 'default']
    let sequence = init(0)
    sequence.next()

    function * init (index) {
      const cache = bypass[index]
      let res = graphql(Query(), { cache, key: cache })
      t.deepEqual(res, {}, `empty result while loading using ${cache}`)
      yield
      res = graphql(Query(), { cache, key: cache })
      t.deepEqual(res, {}, `was not retrieved from cache using ${cache}`)
      yield
      res = graphql(Query(), { key: cache })
      if (cache === 'no-store') {
        t.deepEqual(res, {}, `was not stored in cache using ${cache}`)
      } else {
        t.deepEqual(res, { data: { hello: 'hi' } }, `was stored in cache using ${cache}`)
      }

      if (index < bypass.length - 1) {
        sequence = init(index + 1)
        sequence.next()
      }
    }

    function fetch (url, opts, cb) {
      setTimeout(function () {
        cb(null, { data: { hello: 'hi' } })
        sequence.next()
      }, 100)
    }
  })

  t.test('custom cache', function (t) {
    const cache = new Map()
    const graphql = nanographql('/graphql', { fetch, cache })
    const { Query } = gql`
      query Query {
        hello
      }
    `

    const operation = Query()
    graphql(operation, { key: 'key' })
    t.ok(cache.has(operation.key))
    t.deepEqual(cache.get(operation.key).key, { data: { hello: 'hi' } })
    t.end()

    function fetch (url, opts, cb) {
      cb(null, { data: { hello: 'hi' } })
    }
  })
})

tape('parse', function (t) {
  t.plan(5)

  const graphql = nanographql('/graphql', { fetch })
  const { Query } = gql`
    query Query {
      hello
    }
  `

  let res = graphql(Query(), {
    parse (res, cached) {
      t.deepEqual(res, { data: { hello: 'hi' } }, 'parse got original response')
      t.notOk(cached, 'nothing cached on first run')
      return { data: { hello: 'hey' } }
    }
  })
  t.deepEqual(res, { data: { hello: 'hey' } }, 'response was parsed')

  res = graphql(Query(), {
    cache: 'no-cache',
    parse (res, cached) {
      t.deepEqual(cached, { data: { hello: 'hey' } }, 'parse got cached response')
      return { data: { hello: 'greetings' } }
    }
  })
  t.deepEqual(res, { data: { hello: 'greetings' } }, 'response was parsed')

  function fetch (url, opts, cb) {
    cb(null, { data: { hello: 'hi' } })
  }
})

tape('mutate', function (t) {
  t.plan(3)

  const graphql = nanographql('/graphql', { fetch })
  const { Query, Mutation } = gql`
    query Query {
      hello
    }
    mutation Mutation {
      hello
    }
  `

  const sequence = init()
  sequence.next()

  function * init () {
    graphql(Query(), { key: 'foo' }) // Populate cache

    yield

    let res = graphql(Mutation(), {
      key: 'foo',
      mutate (cached) {
        t.deepEqual(cached, { data: { hello: 'hi' } }, 'mutate got cached value')
        return { data: { hello: 'hey' } }
      }
    })

    res = graphql(Query(), { key: 'foo' })
    t.deepEqual(res, { data: { hello: 'hey' } }, 'got mutated value')

    yield

    res = graphql(Query(), { key: 'foo' })
    t.deepEqual(res, { data: { hello: 'hi' } }, 'mutation was overwritten')
  }

  function fetch (url, opts, cb) {
    setTimeout(function () {
      cb(null, { data: { hello: 'hi' } })
      sequence.next()
    }, 100)
  }
})
