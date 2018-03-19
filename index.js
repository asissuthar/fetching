'use strict';

const wrap = require('word-wrap')
const axios = require('axios')
const jsonpath = require('jsonpath')
const xpath = require('xpath')
const xmldom = require('xmldom')
const dom = xmldom.DOMParser

const get = url => axios(url).then(res => res.data)

const json = (data, path) => jsonpath
  .apply(data, path, value => `${value}`)
  .map(item => item ? item.value : null)

const xml = (data, path) => xpath
  .select(path, new dom().parseFromString(data))
  .map(item => item.firstChild ? item.firstChild.data : null)

const source = (data, query, type) => type === 'json' ? json(data, query) : xml(data, query)
const clean = (items)  => items.filter(item => item != null)
const prefix = (items, value) => items.map(item => `${value}${item}`)
const resize = (items, _wrap, _width) => _wrap ? items.map(item => wrap(item, { width: _width, indent: '' })) : items
const join = (items, value) => items.join(value.replace(/\\n/g, '\n'))
const plain = (data, type) => type === 'json' ? JSON.stringify(data) : data

module.exports = (options) => {
  let request = get(options.url)
  if(options.query) {
    return request
      .then(data => source(data, options.query, options.type))
      .then(items => clean(items))
      .then(items => prefix(items, options.prefix))
      .then(items => resize(items, options.wrap, options.width))
      .then(items => join(items, options.separator))
  } else {
    return request
      .then(data => plain(data, options.type))
  }
}