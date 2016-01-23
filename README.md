# graphy [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Query linked-data graphs by abstracting away traditional JSON-LD interaction


## Install

```sh
$ npm install --save graphy
```


## Usage

Take the following graph:
```turtle
@prefix ns: <vocab://ns/> .
@prefix color: <vocab://color/> .
@prefix plant: <vocab://plant/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ns:Banana
	a ns:Fruit ;
	ns:shape "curved"^^ns:Liberty ;
	ns:tastes "good"^^xsd:string ;
	ns:data 25 ;
	ns:class ns:Berry ;
	ns:appears color:Yellow ;
	plant:blossoms ns:YearRound ;
	ns:alias ns:Cavendish ;
	ns:alias ns:Naner ;
	ns:alias ns:Bananarama ;
	ns:stages (
		ns:FindSpace
		plant:Seed
		plant:Grow
		plant:Harvest
	) ;
	ns:considered [
		a plant:Clone
	]
```

Here, `example.json` is a JSON-LD file generated from the graph above:
```js
var graphy = require('graphy');

var json_ld = require('./example.json');
var q_graph = graphy(json_ld);

// traverse the graph using namespace given by the prefix 'ns:'
q_graph.network('ns:', function(k_banana) {

	// get iri of node
	k_banana.$id; // 'Banana'
	k_banana['@id']; // 'vocab://ns/Banana'

	// get default `rdf:type` property of node
	k_banana.$type; // 'Fruit'
	k_banana['@type']; // 'vocab://ns/Fruit'

	// get value of a literal
	k_banana.shape(); // 'curved'
	k_banana.tastes(); // 'good'

	// get suffixed datatype of a literal
	k_banana.shape.$type; // 'Liberty'
	k_banana.tastes.$type; // undefined

	// get absolute datatype of a literal
	k_banana.shape['@type']; // 'vocab://ns/Liberty'
	k_banana.tastes['@type']; // 'http://www.w3.org/2001/XMLSchema#string'

	// get full SPARQL/TTL-compatible string representation of any entity
	k_banana.class['@full']; // '<vocab://ns/Berry>'
	k_banana.tastes['@full']; // '"good"^^<http://www.w3.org/2001/XMLSchema#string>'
	k_banana.stages['@full']; // '[<http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <vocab://ns/FindSpace>;<http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> (<vocab://plant/Seed> <vocab://plant/Grow> <vocab://plant/Harvest>)]'

	// change namespace to get suffixed datatype of literal
	k_banana.tastes.$('xsd:').$type; // 'string'
	k_banana.tastes.$('xsd:').$types; // ['string']

	// properties of an iri in same namespace
	k_banana.class(); // 'Berry'
	k_banana.class.$id; // 'Berry'
	k_banana.class['@id']; // 'vocab://ns/Berry'
	k_banana.class['@type']; // '@id'

	// properties of an iri in different namespace
	k_banana.appears(); // undefined
	k_banana.appears.$id; // undefined
	k_banana.appears['@id']; // 'vocab://color/Yellow'
	k_banana.appears['@type']; // '@id'
	k_banana.appears.$('color:').$id; // 'Yellow'

	// changing namespace
	k_banana.$('plant:').blossoms(); // undefined
	k_banana.$('plant:').blossoms.$id; // 'vocab://ns/YearRound'
	k_banana.$('plant:').blossoms.$('ns:').$id; // 'YearRound'

	// terse form: auto-prefixing (SPARQL & TTL compatible strings)
	k_banana.$terse(); // 'ns:Banana'
	k_banana.appears.$terse(); // 'color:Yellow'
	k_banana.tastes.$terse(); // '"good"^^xsd:string'
	k_banana.tastes.$terse.value(); // '"good"'
	k_banana.tastes.$terse.datatype(); // 'xsd:string'

	// type indicators
	k_banana.$is(); // 'node'
	k_banana.$is.node; // true

	// type indicators ..contd'
	k_banana.appears.$is(); // 'iri'
	k_banana.data.$is(); // 'literal'
	k_banana.stages.$is(); // 'collection'
	k_banana.considered.$is(); // 'blanknode'

	// type indicators ..contd'
	k_banana.$is.node; // true
	k_banana.appears.$is.iri; // true
	k_banana.data.$is.literal; // true
	k_banana.stages.$is.iri; // undefined
	k_banana.stages.$is.literal; // undefined
	k_banana.stages.$is.collection; // true
	k_banana.considered.$is.blanknode; // true

	// predicates with multiple objects
	k_banana.alias; // emits warning: 'more than one triple share the same predicate "ns:alias" with subject "ns:Banana"; By using '.alias', you are accessing any one of these triples arbitrarily'

	// ..contd'
	let a_items = k_banana('alias', function(k_alias) { // implicit `.map` callback
		return k_alias();
	});
	a_items; // ['Cavendish', 'Naner', 'Bananarama']

	// collections
	k_banana.stages().map(function(k_stage) {
		return k_stage.$id || k_stage.$('plant:').$id;
	}); // ['FindSpace', 'Seed', 'Grow', 'Harvest']

	// collections: implicit `.map`
	k_banana.stages(function(k_stage) { // implicit `.map` callback
		return k_stage.$id || k_stage.$('plant:').$id;
	}); // ['FindSpace', 'Seed', 'Grow', 'Harvest']

	// collections: implicit array accessor
	k_banana.stages(0).$id; // 'FindSpace'
});
```

## Iterating

`for..in`

`for..of`

## RDF Collections

Calling a collection node as a function with no arguments will return the underlying array.
```js
...
```
> The returned array is the underlying array; mutating the returned object will also affect the underlying array

You can also iterate a collection node using `for..of`
```js
for(let k_stage of k_banana.stages) {
	// ...
}
```

In order to be consistent with the graph, rdf collection properties are emulated on collection objects. So instead of accessing a collection's elements via Array's properties/methods, you can also use the `rdf:first` and `rdf:rest` properties:
```javascript
let w_list = k_banana.stages.$('rdf:');

w_list.first.$('ns:').$id; // 'FindSpace'

w_list = w_list.rest;
w_list.first.$('plant:').$id; // 'Seed'

w_list = w_list.rest;
w_list.first.$('plant:').$id; // 'Grow'

w_list = w_list.rest;
w_list.first.$('plant:').$id; // 'Harvest'

w_list = w_list.rest;
w_list.$id; // 'nil'

// ------------ or in a loop ------------
let a_stages = [];
let w_list = k_banana.stages.$('rdf:');
while(w_list.$id !== 'nil') {
	a_stage.push(w_list.first.$('plant:').$id || w_list.first.$('ns:').$id);
	w_list = w_list.rest;
}
a_stages; // ['FindSpace', 'Seed', 'Grow', 'Harvest']
```


### node.$(namespace: string)
Returns a node that points to the same LD node but changes its namespace to the expanded version of the IRI given by `namespace`, may be either an n3 prefix or a full IRI. By chaining this call, you can change the namespace on the same line to access properties or IRIs by their suffix.

### node.$n3()
Returns a terse n3 representation of the node as a string. It is prefixed by the longest matching URI available in the original JSON-LD context, unless the resulting suffix would contain invalid characters for a prefixed IRI in either SPARQL or TTL. The string is compatible with SPARQL and TTL as long as the corresponding prefix is also included in the document.

### node.$nquad()
Returns the n-quad representation of this node. Useful for serializing to SPARQL/TTL without worrying about prefixes.

### node.$is()
Calling this function returns the type of this node as a string. You can also use a shorthand check by testing if `node.$is.[type]` is defined as `true`. eg: `if(node.$is.iri === true) ...`. Possible values for type are:
 - *link* - this is a named thing which exists as the subject of triple(s). This node contains predicates that point to objects
 - *blanknode* - this is an anonymous blanknode (@id starts with `_:`)
 - *iri* - this is a mere symbollic reference to an IRI, which exists as the object of some triple. If you encounter this type, it means that you reached a named thing (ie: not a blanknode). Use `.$node` to obtain the node of this IRI if it exists in the current graph
 - *literal* - an RDF literal
 - *collection* - an RDF collection

### node.$node()
Only defined on nodes of type `iri`. Will return the node 

### node['@id']
Reflects the json-ld `@id` property.

### node.$id
The suffix of the `@id` property after removing the current namespace from the beginning. If the current namespace does not match, this will return `undefined`.

### node['@type']
Reflects the json-ld `@type` property. For literals, this will be the datatype. For nodes, this will be an array of objects pointed to by the `rdf:type` predicate.

### node.$types
An array containing the suffixes of the IRIs pointed to by the `@type` property after removing the current namespace from the beginning of the IRI. If the current namespace does not match any of the IRIs, this will return an empty array `[]`.

### node.$type
Shortcut for `node.$types[0]`. If this node has more than one `rdf:type`, accessing this property will issue a warning. If the current namespace does not match any of the IRIs, this will return `undefined`. 



## License

ISC © [Blake Regalia]()


[npm-image]: https://badge.fury.io/js/graphy.js.svg
[npm-url]: https://npmjs.org/package/graphy
[travis-image]: https://travis-ci.org/blake-regalia/graphy.js.svg?branch=master
[travis-url]: https://travis-ci.org/blake-regalia/graphy.js
[daviddm-image]: https://david-dm.org/blake-regalia/graphy.js.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/blake-regalia/graphy.js
[coveralls-image]: https://coveralls.io/repos/blake-regalia/graphy.js/badge.svg
[coveralls-url]: https://coveralls.io/r/blake-regalia/graphy.js
