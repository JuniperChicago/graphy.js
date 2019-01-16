
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] 

<h1>
  <code class="super-graphy">graphy</code> is a collection of RDF libraries for JavaScript developers with a focus on performance and usability.
</h1>
> Each package works with both Node.js and the browser (with the help of a bundler such as Browserify or Webpack).

<br />

## [API Reference](api)
<div class="larger">
  Documentation for the `graphy` JavaScript API. Includes API examples.
</div>

## [Command Line Interface](cli)
<div class="larger">
  Documentation for the `$ graphy` command-line interface. Includes CLI examples.
</div>

## Features
<div class="larger">
 - [Read & write RDF documents](content.textual) using streams. Includes support for N-Triples (.nt), N-Quads (.nq), Turtle (.ttl), and TriG (.trig).
 - [Construct RDF data](concise#hash_c3) using ES object literals that reflect the tree-like structure of quads, `graph -> subject -> predicate -> object`, including nested blank nodes and RDF collections.
<!-- - [High-performance](#performance) document readers. -->
 - [Compute the union, intersection, difference or subtraction](util.dataset.tree) between multiple RDF graphs analagous to [Set Algebra](https://en.wikipedia.org/wiki/Algebra_of_sets).
 - [Compare two RDF graphs](util.dataset.tree) for equivalence, containment, and disjointness by employing the [RDF Dataset Normalization Algorithm](https://json-ld.github.io/normalization/spec/).
 - [Transform RDF data from the command-line](cli) by piping them through a series of sub-commands.
</div>


## Package Tree
<div class="larger">
  The [graphy GitHub repository](https://github.com/blake-regalia/graphy.js) contains source code for all of the packages published on npm under the `@graphy` org. Each package is namespaced according to its category, sub-category, and function. They are enumerated here for clarity:
</div>

```yaml
graphy/:
  core.:
    data.:
      factory: '@graphy/core.data.factory'
  util.:
    dataset.:
      tree: '@graphy/util.dataset.tree'
  content.:
    nt.:
      read: '@graphy/content.nt.read'
      write: '@graphy/content.nt.write'
    nq.:
      read: '@graphy/content.nq.read'
      write: '@graphy/content.nq.write'
    ttl.:
      read: '@graphy/content.ttl.read'
      write: '@graphy/content.ttl.write'
    trig.:
      read: '@graphy/content.trig.read'
      write: '@graphy/content.trig.write'
```

<br />

## Examples

#### Covert a CSV document to a Turtle document
```js
// snippets/transform-csv.js
const csv_parse = require('csv-parse');
const stream = require('@graphy/core.iso.stream');
const ttl_write = require('@graphy/content.ttl.write');


// read from standard input
process.stdin
   // parse string chunks from CSV into row objects
   .pipe(csv_parse())

   // transform each row
   .pipe(new stream.Transform({
      // this transform both expects objects as input and outputs object
      objectMode: true,

      // each row
      transform(a_row, s_encoding, fk_transform) {
         // destructure row into cells
         let [s_id, s_name, s_likes] = a_row;

         // structure data into concise-triple hash
         fk_transform(null, {
            type: 'c3',
            value: {
               ['demo:'+s_name]: {
                  'foaf:name': '"'+s_name,
                  'demo:id': parseInt(s_id),
                  'demo:likes': s_likes.split(/\s+/g)
                     .map(s => `demo:${s}`),
               },
            },
         });
      },
   }))

   // serialize each triple
   .pipe(ttl_write({
      prefixes: {
         demo: 'http://ex.org/',
         foaf: 'http://xmlns.com/foaf/0.1/',
      },
   }))

   // write to standard output
   .pipe(process.stdout)

   // listen for errors; throw them
   .on('error', (e_pipeline) => {
      throw e_pipeline;
   });
```

Run from the command line with:
```sh
cat <<EOF | node snippets/transform-csv.js
> 1,Blake,Banana
> 2,Banana,Water Sunlight Soil
> EOF
```

Outputs:
```turtle
@prefix demo: <http://ex.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

demo:Blake foaf:name "Blake" ;
   demo:id 1 ;
   demo:likes demo:Banana .

demo:Banana foaf:name "Banana" ;
   demo:id 2 ;
   demo:likes demo:Water, demo:Sunlight, demo:Soil .


```

<br />

## License

ISC © [Blake Regalia]()


[npm-image]: https://badge.fury.io/js/graphy.svg
[npm-url]: https://npmjs.org/package/graphy
[travis-image]: https://travis-ci.org/blake-regalia/graphy.js.svg?branch=master
[travis-url]: https://travis-ci.org/blake-regalia/graphy.js
[daviddm-image]: https://david-dm.org/blake-regalia/graphy.js.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/blake-regalia/graphy.js


<style>
  section h2 {
    margin-bottom: 6pt;
  }
</style>