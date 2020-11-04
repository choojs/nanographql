const parsed = new WeakMap()
const bypass = ['no-store', 'reload', 'no-cache', 'default']
const getPlaceholders = /(\.\.\.)?\0(\d+)\0/g
const getOperations = /\s*(query|subscription|mutation|fragment)\s*(\w+)?\s*(?:(?:\(.*?\))|on\s*\w+)?\s*\{/g

class Operation {
  constructor ({ key, type, query, variables, operationName }) {
    this.operationName = operationName
    this.variables = variables
    this.query = query
    this.type = type
    this.key = key
  }

  * [Symbol.iterator] () {
    yield ['query', this.query]
    yield ['variables', this.variables]
    if (this.operationName) yield ['operationName', this.operationName]
  }

  toString () {
    const { query, variables, operationName } = this
    const parts = [
      `query=${encodeURIComponent(query.replace(/\s+/g, ' ').trim())}`,
      `variables=${encodeURIComponent(JSON.stringify(variables))}`
    ]
    if (operationName) parts.push(`operationName=${operationName}`)
    return parts.join('&')
  }

  toJSON () {
    let { query, variables, operationName } = this
    query = query.replace(/\s+/g, ' ').trim()
    return { query, variables, operationName }
  }
}

exports.gql = gql
exports.Operation = Operation
exports.nanographql = nanographql

function nanographql (url, opts = {}) {
  let { cache, fetch } = opts

  if (!cache) cache = new Map()
  if (typeof fetch !== 'function') {
    fetch = function (url, opts, cb) {
      window.fetch(url, opts).then((res) => res.json()).then((res) => cb(null, res), cb)
    }
  }

  return function (operation, opts = {}, cb = Function.prototype) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }

    let { method, body, headers } = opts
    const { variables, type } = operation
    const querystring = operation.toString()
    let href = url.toString()

    let key = opts.key || (variables ? serialize(variables) : querystring)
    if (typeof key === 'function') key = opts.key(variables)
    let useCache = !body && type !== 'mutation' && !bypass.includes(opts.cache)
    let store = cache.get(operation.key)
    if (!store) cache.set(operation.key, store = {})
    let cached = store[key]

    if (opts.mutate || useCache) {
      if (opts.mutate) cached = store[key] = opts.mutate(cached)
      if (cached != null && useCache) return cached
    }

    if (body || type === 'mutation' || (href + querystring).length >= 2000) {
      method = method || 'POST'
      if (!body) { // Don't bother with custom bodies
        body = JSON.stringify(operation)
        headers = { ...headers, 'Content-Type': 'application/json' }
      }
    } else {
      let [domainpath, query] = href.split('?')
      query = query ? query + `&${querystring}` : querystring
      href = `${domainpath}?${query}`
    }

    let errored = false
    fetch(href, { ...opts, method, headers, body }, function (err, res) {
      useCache = true // it's not really cached when resolved sync
      if (err) {
        delete store[key]
        errored = true
        return cb(err)
      }
      if (typeof opts.key === 'function') key = opts.key(variables, res)
      if (typeof opts.parse === 'function') res = opts.parse(res, store[key])
      if (opts.cache !== 'no-store') store[key] = res
      cb(null, res)
    })

    cached = store[key]
    if (!cached && !errored) store[key] = {}
    if (errored || !useCache) return {}
    return store[key] || {}
  }
}

function gql (strings, ...values) {
  let operation = parsed.get(strings)
  if (operation) return operation
  operation = parse(strings, values)
  parsed.set(strings, operation)
  return operation
}

function parse (strings, values) {
  // Compile query with placeholders for partials
  const template = strings.reduce(function (query, str, index) {
    query += str
    if (values[index] != null) query += `\u0000${index}\u0000`
    return query
  }, '')

  let match
  const operations = []

  // Extract individual operations from template
  while ((match = getOperations.exec(template))) {
    const index = getOperations.lastIndex
    const [query, type, name] = match
    const prev = operations[operations.length - 1]
    if (prev) {
      prev.query += template.substring(prev.index, index - query.length)
    }
    operations.push({ type, name, query, index })
  }

  // Add on trailing piece of template
  const last = operations[operations.length - 1]
  if (last) last.query += template.substring(last.index)

  // Inject fragment into operation query
  const fragments = operations.filter((operation) => operation.type === 'fragment')
  if (fragments.length) {
    for (const operation of operations) {
      if (operation.type === 'fragment') continue
      for (const fragment of fragments) {
        if (operation.query.includes(`...${fragment.name}`)) {
          operation.query += fragment.query
        }
      }
    }
  }

  // Decorate base operation
  for (const operation of operations) {
    const name = operation.name || operation.type
    Object.defineProperty(createOperation, name, {
      value (variables) {
        return new Operation({
          variables,
          key: template,
          type: operation.type,
          operationName: operation.name,
          query: compile(operation.query, variables, values)
        })
      }
    })
  }

  return createOperation

  function createOperation (variables) {
    return new Operation({
      variables,
      key: template,
      query: compile(template, variables, values)
    })
  }
}

function compile (template, variables, values) {
  const external = new Set()
  let query = template.replace(getPlaceholders, function (_, spread, index) {
    let value = values[+index]
    if (typeof value === 'function') value = value(variables)
    if (value instanceof Operation) {
      if (value.type === 'fragment') {
        external.add(value.query)
        if (spread) return `...${value.operationName}`
      }
      return ''
    }
    if (value == null) return ''
    return value
  })
  query += Array.from(external).join(' ')
  return query
}

// Serialize object into a predictable (sorted by key) string representation
function serialize (obj, prefix = '') {
  return Object.keys(obj).sort().map(function (key) {
    const value = obj[key]
    const name = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') return serialize(obj, key)
    return `${name}=${value}`
  }).join('&')
}
