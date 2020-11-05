# nanographql [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Tiny GraphQL client library. Compiles queries, fetches them and caches them, all
in one tiny package.

## Usage
```js
const { gql, nanographql } = require('nanographql')

const Query = gql`
  query($name: String!) {
    movie (name: $name) {
      releaseDate
    }
  }
`

const graphql = nanographql('/graphql')
const { errors, data } = graphql(Query({ name: 'Back to the Future' }))

```

## API
### ``query = gql`[query]` ``
Create a new graphql query function.

### `operation = query([data])`
Create a new operation object that holds all data necessary to execute the query
against an endpoint. An operation can be stringified to a query (`toString`),
serialized to a plain object (`toJSON`) or iterated over.

### `cache = nanographql(url[, opts])`
Create a managed cache which fetches data as it is requested.

#### Options
- **`cache`:** a custom cache store. Should implement `get` and `set` methods.
  The default is a [`Map`][15].
- **`fetch`:** a custom [`fetch`][12] implementation. The `fetch` option should
  be a function which takes three arguments, `url`, `opts` and a callback
  function. The callback function should be called whenever there is an error or
  new data available. The default is an implementation of `window.fetch`.

### `result = cache(operation[, opts][, cb])`
Query the cache and fetch query if necessary. The options match that of
[`fetch`][13] with a couple extra options. The callback will be called whenever
an error or new data becomes available.

#### Options
The options are forwarded to the [`fetch`][12] implementation but a few are
also used to determine when to use the cache and how to format the request.

##### Default options
- **`cache`:** The default behavior of nanographql mimics that of `force-cache`
  as it will always try and read from the cache unless specified otherwise. Any
  of the values `no-store`, `reload`, `no-cache`, `default` will cause
  nanographql to bypass the cache and call the fetch implementation. The value
  `no-store` will also prevent the response from being cached locally. See
  [cache mode][14] for more details.
- **`body`:** If a body is defined, nanographql will make no changes to headers
  or the body itself. You'll have to append the operation to the body yourself.
- **`method`:** If the operation is a `mutation` or if the stringified
  operation is too long to be transferred as `GET` parameters, the method will
  be set to `POST`, unless specified otherwise.

##### Extra options
- **`key|key(variables[, cached])`:** A unique identifier for the requested
  data. Can be a string or a function. Functions will be called with the
  variables and the cached data, if there is any. This can be used to determine
  the key of e.g. a mutation where the key is not known untill a response is
  retrieved. The default is the variables as a serialized string, or a
  stringified representation of the query if no variables are provided.
- **`parse(response[, cached])`:** Parse the incoming data before comitting to
  the cache.
- **`mutate(cached)`:** Mutate the cached data prior to reading from cache or
  fetching data. This is useful for e.g. immedately updating the UI while
  submitting changes to the back end.

## Expressions and Operations
One of the benefits of GraphQL is the strucuted format of the queries. When
passing a query to the `gql` tag, nanographql will parse the string identifying
individual queries, mutations, subscritions and fragments and expose these as
individual operations. It will also mix in interpolated fragments from other
queries.

```js
const choo = require('choo')
const html = require('choo/html')
const { gql, nanographql } = require('nanographql')

const { user } = gql`
  fragment user on User {
    id
    name
  }
`

const { GetUser, SaveUser } = gql`
  query GetUser($id: ID!) {
    user: getUser(id: $id) {
      ...${user}
    }
  }
  mutation SaveUser($id: ID!, $name: String) {
    user: saveUser(id: $id, name: $name) {
      ...${user}
    }
  }
`

const app = choo()

app.route('/', main)

app.use(function (state, emitter) {
  const graphql = nanographql('/graphql')

  state.api = (...args) => graphql(...args, render)

  function render () {
    emitter.emit('render')
  }
})

app.mount(document.body)

function main (state, emit) {
  const { api } = state
  const { errors, data } = api(GetUser({ id: 'abc123' }), { key: 'abc123' })

  if (errors) return html`<body><p>User not found</p><body>`
  if (!data) return html`<body><p>Loading</p><body>`

  return html`
    <body>
      <form onsubmit=${onsubmit}>
        Name: <input value="${data.user.name}" name="username">
        <button>Save</button>
      </form>
    </body>
  `

  function onsubmit (event) {
    api(SaveUser({ id: 'abc123', name: this.username.value }), {
      key: 'abc123',
      mutate (cached) {
        const user = { ...cached.data.user, name }
        return { data: { user } }
      }
    })
    event.preventDefault()
  }
}
```


## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-stable-brightgreen.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/nanographql.svg?style=flat-square
[3]: https://npmjs.org/package/nanographql
[4]: https://img.shields.io/travis/yoshuawuyts/nanographql/master.svg?style=flat-square
[5]: https://travis-ci.org/yoshuawuyts/nanographql
[6]: https://img.shields.io/codecov/c/github/yoshuawuyts/nanographql/master.svg?style=flat-square
[7]: https://codecov.io/github/yoshuawuyts/nanographql
[8]: http://img.shields.io/npm/dm/nanographql.svg?style=flat-square
[9]: https://npmjs.org/package/nanographql
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
[12]: https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
[13]: https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters
[14]: https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
[15]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
