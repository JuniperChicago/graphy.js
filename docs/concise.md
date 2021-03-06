

# [« API](api) / Concise Terms, Triples and Quads
This document describes a language for concisely expressing RDF data from within a JavaScript programming environment, allowing for a convenient technique of mixing in data from live variables and objects to create RDF quads and RDF terms such as named nodes, blank nodes, and literals.

## Introduction

Concise hashes allow for representing RDF quads and triples in a convenient tree structure. In addition to providing a simple, human-readable interface to constructing RDF data, they also greatly improve the bandwidth of passing around chunks of RDF data between readers, datasets and serializers. Furthermore, special value types can be used within concise hashes (in full-mode) to nest anonymous blank node structures or linked-list structures such as RDF collections, serialize comments or newlines, and configure serializer output options. All of these features make concise hashes an ideal data structure for generating RDF programatically.

**Example:**
```js
// snippets/concise-triples.js
const factory = require('@graphy/core.data.factory');
const ttl_write = require('@graphy/content.ttl.write');

// create a Turtle content writer
let ds_writer = ttl_write({
   prefixes: {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      owl: 'http://www.w3.org/2002/07/owl#',
      dbr: 'http://dbpedia.org/resource/',
      dbo: 'http://dbpedia.org/ontology/',
      demo: 'http://ex.org/demo#',
      eg: 'http://ex.org/owl#',
   },
});

// pipe to stdout
ds_writer.pipe(process.stdout);

// write some triples using a concise triples hash
ds_writer.write({
   type: 'c3',
   value: {
      // triples about dbr:Banana
      [factory.comment()]: 'hey look, a comment!',
      'dbr:Banana': {
         // `a` is shortcut for rdf:type
         a: 'dbo:Plant',

         // primitive ES types map to XSD datatypes
         'eg:boolean': true,
         'eg:integer': 42,
         'eg:decimal': 0.1,
         'eg:infinity': Infinity,

         // list of objects
         'rdfs:label': ['@en"Banana', '@fr"Banane', '@es"Plátano'],

         // nested array becomes an RDF collection
         'demo:steps': [
            ['demo:Peel', 'demo:Slice', 'demo:distribute'],
         ],
      },

      // example from OWL 2 primer: https://www.w3.org/TR/owl2-primer/#Property_Restrictions
      [factory.comment()]: 'hey look, another comment!',
      'eg:HappyPerson': {
         a: 'owl:Class',

         // nesting an anonymous blank node
         'owl:equivalentClass': {
            a: 'owl:Class',

            // a list of objects
            'owl:intersectionOf': [
               [
                  // nested anonymous blank node
                  {
                     a: 'owl:Restriction',
                     'owl:onProperty': 'eg:hasChild',
                     'owl:allValuesFrom': 'eg:Happy',
                  },
                  // another nested anonymous blank node
                  {
                     a: 'owl:Restriction',
                     'owl:onProperty': 'eg:hasChild',
                     'owl:someValuesFrom': 'eg:Happy',
                  },
               ],
            ],
         },
      },
   },
});

// end the writable side of the transform
ds_writer.end();
```

**Outputs:**
```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix dbr: <http://dbpedia.org/resource/> .
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix demo: <http://ex.org/demo#> .
@prefix eg: <http://ex.org/owl#> .

# hey look, a comment!
dbr:Banana a dbo:Plant ;
   eg:boolean true ;
   eg:integer 42 ;
   eg:decimal 0.1 ;
   eg:infinity "INF"^^<http://www.w3.org/2001/XMLSchema#double> ;
   rdfs:label "Banana"@en, "Banane"@fr, "Plátano"@es ;
   demo:steps (
      demo:Peel
      demo:Slice
      demo:distribute
   ) .

# hey look, another comment!
eg:HappyPerson a owl:Class ;
   owl:equivalentClass [
      rdf:type owl:Class ;
      owl:intersectionOf (
         [
            rdf:type owl:Restriction ;
            owl:onProperty eg:hasChild ;
            owl:allValuesFrom eg:Happy ;
         ]
         [
            rdf:type owl:Restriction ;
            owl:onProperty eg:hasChild ;
            owl:someValuesFrom eg:Happy ;
         ]
      ) ;
   ] .


```

<a name="string_c1" />

### `#string/c1` -- Concise Term String
The concise term string defines a syntax that allows developers to quickly create RDF terms such as named nodes, blank nodes, and literals from a simple string. The syntax should be familiar to those who use Turtle.
 
The first character of the string dictates what type of Term it is:
 - `>` -- NamedNode (absolute IRI)
 - `_` -- BlankNode
 - `@` -- Literal w/ language tag
 - `^` -- Literal w/ datatype
 - `"` -- plain Literal
 - `*` -- DefaultGraph
 - `?` -- Variable
 - `` ` `` *(backtick)* -- directive
 - *else* -- NamedNode (prefixed name or `'a'` for the rdf:type alias)

#### Named Nodes: No Closing Brackets
Notice that the first character to indicate an absolute IRI is the right-angle bracket `>`. This was selected intentionally to remind you that the format does not have a closing bracket for absolute IRIs.

```js
let p_iri = 'http://dbpedia.org/resource/9/11_Memorial_(Arizona)';
let yt_node = factory.c1('>'+p_iri);
```

#### Labeled Blank Nodes: When to Use Them
There's not much need to create labeled blank nodes using concise-term strings since you can implicitly create them using [concise triple](#hash/c3) and [concise quad](#hash/c4) hashes. However, if you need to create new triples where the subject is a blank node, or need to use labeled blank nodes, this syntax will allow you to create them explicitly.

```js
let a_triples = [...factory.c3({
    '_:b1': {
        // usual blank node label
        '>http://ex.org/dislikes': '_:b2',

        // some custom blank node label
        '>http://ex.org/pointsTo': '_:someLabeledBlankNode',

        // automatically creates a unique labeled blank node (using uuidv4)
        '>http://ex.org/unique': '_:',

        // creates anonymous blank node
        '>http://ex.org/anonymous': {},

        // creates anonymous blank node with its own triple(s)
        '>http://ex.org/likes': {
            a: '>http://ex.org/AnonymousBlankNode',
        },
    },
})];
```


#### Literals: No Escaping Needed
Since only one term can be expressed in a string, the syntax does not need to have delimiters for the start or end of certain sequences and so the contents of a Literal do not need to be escaped. For example, a plain RDF literal can be expressed like so:

```js
let s_expression = 'Hello World!';
let yt_greeting = factory.c1('"'+s_expression);
```

Here, the double quote at position `0` indicates that this is a plain literal, and that the contents follow (until the end of the string). If you wanted to add quote characters to the contents of the RDF literal, it would simply look like this:

```js
let s_expression = '"Hello World!"';
let yt_greeting = factory.c1('"'+s_expression);
```

#### Prefixed Names: All Characters Allowed
The 'suffix' of prefixed names may contain any character, such as `/`, `.`, `,`, and so on, without having to worry about the way it is serialized to the output destination. Invalid IRI characters (`[#x00-#x20<>"{}|^`\]`) will be automatically converted to unicode escape sequences.

```js
let h_prefixes = {dbr:'http://dbpedia.org/resource/'};
let yt_node = factory.c1('dbr:9/11_Memorial_(Arizona)', h_prefixes);
yt_node.value;  // 'http://dbpedia.org/resource/9/11_Memorial_(Arizona)'
```

#### Concise Term String Grammar



<table class="tabular">
    <thead>
        <tr>
            <th>State</th>
            <th>Production</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Term</td>
            <td><code>NamedNode | BlankNode | Literal | DefaultGraph | Variable | Directive</code></td>
        </tr>
        <tr>
            <td>NamedNode</td>
            <td><code>AbsoluteIRI | PrefixedName | TypeAlias</code></td>
        </tr>
        <tr>
            <td>AbsoluteIRI</td>
            <td><code>'&gt;' .*</code></td>
        </tr>
        <tr>
            <td>PrefixedName</td>
            <td><code>([^_:@"^`][^:]*)? ':' .*</code></td>
        </tr>
        <tr>
            <td>TypeAlias</td>
            <td><code>'a'</code></td>
        </tr>
        <tr>
            <td>BlankNode</td>
            <td><code>'_' ':' .*</code></td>
        </tr>
        <tr>
            <td>Literal</td>
            <td><code>PlainLiteral | DatatypedLiteral | LanguagedLiteral</code></td>
        </tr>
        <tr>
            <td>PlainLiteral</td>
            <td><code>'"' .*</code></td>
        </tr>
        <tr>
            <td>DatatypedLiteral</td>
            <td><code>'^' Datatype PlainLiteral</code></td>
        </tr>
        <tr>
            <td>Datatype</td>
            <td><code>'>' [^"]* | ([^:@"^\`][^:"]*)? ':' [^"]*</code></td>
        </tr>
        <tr>
            <td>LanguagedLiteral</td>
            <td><code>'@' [a-zA-Z0-9-]+ PlainLiteral</code></td>
        </tr>
        <tr>
            <td>DefaultGraph</td>
            <td><code>'*'</code></td>
        </tr>
        <tr>
            <td>Variable</td>
            <td><code>'?' .*</code></td>
        </tr>
        <tr>
            <td>Directive</td>
            <td><code>'`' '[' uuid_v4 ']' JSON</code></td>
        </tr>
    </tbody>
</table>


----

## Hash Interfaces:
A 'hash' refers to a dictionary (a plain ES object) `value` with enumerable properties (which themselves may or may not be defined in `value`'s prototype chain). The following section documents the implications of the key and value types.


#### Directives
Directives allow for special events to be passed to the output serializer at a given location within the document, such as for the insertion of comments and newlines, as well as to configure scoped options such as list structure. The following functions create directive strings which can be used as the keys in concise triples and concise quads hashes:
 - [factory.comment](core.data.factory#function_comment)
 - [factory.newlines](core.data.factory#function_comment)


----

<a name="hash_c4r" />

### `#hash/c4r` -- Concise Quads Hash (strict-mode)
A concise quads hash **in strict-mode** describes a plain object whose keys represent the *graph* of a set of quads, and whose values are [concise triple hashes in strict-mode](#hash_c3r), which represent the subjects, predicates and objects related to the graph/subject/predicate combinations in a tree-like structure.


**Example:**
```js
// snippets/concise-quads-strict-mode.js
const trig_write = require('@graphy/content.trig.write');

// create a TriG content writer
let ds_writer = trig_write({
   prefixes: {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      owl: 'http://www.w3.org/2002/07/owl#',
      dbr: 'http://dbpedia.org/resource/',
      dbo: 'http://dbpedia.org/ontology/',
      dc: 'http://purl.org/dc/terms/',
      foaf: 'http://xmlns.com/foaf/0.1/',
      demo: 'http://ex.org/demo#',
   },
});

// pipe to stdout
ds_writer.pipe(process.stdout);

// write some quads using a concise quads hash
ds_writer.write({
   type: 'c4r',
   value: {  // example 2 from TriG: https://www.w3.org/TR/trig/
      '*': {
         'demo:bob': {
            'dc:publisher': ['"Bob'],
         },
         'demo:alice': {
            'dc:publisher': ['"Alice'],
         },
      },

      'demo:bob': {
         '_:a': {
            'foaf:name': ['"Bob'],
            'foaf:mbox': ['>mailto:bob@oldcorp.example.org'],
            'foaf:knows': ['_:b'],
         },
      },

      'demo:alice': {
         '_:b': {
            'foaf:name': ['"Alice'],
            'foaf:mbox': ['>mailto:alice@work.example.org'],
         },
      },
   },
});

// end the writable side of the transform
ds_writer.end();
```

**Outputs:**
```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix dbr: <http://dbpedia.org/resource/> .
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix demo: <http://ex.org/demo#> .

{
   demo:bob dc:publisher "Bob" .

   demo:alice dc:publisher "Alice" .
}

demo:bob {
   _:a foaf:name "Bob" ;
      foaf:mbox <mailto:bob@oldcorp.example.org> ;
      foaf:knows _:b .
}

demo:alice {
   _:b foaf:name "Alice" ;
      foaf:mbox <mailto:alice@work.example.org> .
}


```

----

<a name="hash_c4" />

### `#hash/c4` -- Concise Quads Hash (full-mode)
Extends the strict-mode version by allowing the use of [directives](core.data.factory#writer-directives) in keys (such as embedded comments, newlines, etc.), as well as more flexible ways to write RDF objects including nested blank nodes, list structures, collections, extensible coercible type (e.g., instances of `Date` and `Number`), and strings.

A concise quads hash describes a plain object whose keys represent the *graph* of a set of quads, and whose values are [concise triple hashes](#hash_c3), which represent the subjects, predicates and objects, list structures, collections, or nested blank nodes related to the graph/subject/predicate combinations in a tree-like structure.

**Example:**
```js
// snippets/concise-quads.js
const factory = require('@graphy/core.data.factory');
const trig_write = require('@graphy/content.trig.write');

// create a TriG content writer
let ds_writer = trig_write({
   prefixes: {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      owl: 'http://www.w3.org/2002/07/owl#',
      dbr: 'http://dbpedia.org/resource/',
      dbo: 'http://dbpedia.org/ontology/',
      dc: 'http://purl.org/dc/terms/',
      foaf: 'http://xmlns.com/foaf/0.1/',
      demo: 'http://ex.org/demo#',
   },
});

// pipe to stdout
ds_writer.pipe(process.stdout);

// write some quads using a concise quads hash
ds_writer.write({
   type: 'c4',
   value: {  // example 2 from TriG: https://www.w3.org/TR/trig/
      [factory.comment()]: 'default graph',
      '*': {
         'demo:bob': {
            'dc:publisher': '"Bob',
         },
         'demo:alice': {
            'dc:publisher': '"Alice',
         },
      },

      'demo:bob': {
         '_:a': {
            'foaf:name': '"Bob',
            'foaf:mbox': '>mailto:bob@oldcorp.example.org',
            'foaf:knows': '_:b',
         },
      },

      'demo:alice': {
         '_:b': {
            'foaf:name': '"Alice',
            'foaf:mbox': '>mailto:alice@work.example.org',
         },
      },
   },
});

// end the writable side of the transform
ds_writer.end();
```

**Outputs:**
```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix dbr: <http://dbpedia.org/resource/> .
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix demo: <http://ex.org/demo#> .

# default graph
{
   demo:bob dc:publisher "Bob" .

   demo:alice dc:publisher "Alice" .
}

demo:bob {
   _:a foaf:name "Bob" ;
      foaf:mbox <mailto:bob@oldcorp.example.org> ;
      foaf:knows _:b .
}

demo:alice {
   _:b foaf:name "Alice" ;
      foaf:mbox <mailto:alice@work.example.org> .
}


```

----

<a name="hash_c3r" />

### `#hash/c3r` -- Concise Triples Hash (strict-mode)
A concise triples **in strict-mode** hash describes a plain object whose keys represent the *subject* of a set of triples, and whose values are [concise pair hashes](#hash_c2), which represent the objects, list structures, collections, or nested blank nodes related to the subject/predicate combination in a tree-like structure.

**Example:**
```js
// snippets/concise-triples-strict-mode.js
const ttl_write = require('@graphy/content.ttl.write');

// create a Turtle content writer
let ds_writer = ttl_write({
   prefixes: {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      owl: 'http://www.w3.org/2002/07/owl#',
      dbr: 'http://dbpedia.org/resource/',
      dbo: 'http://dbpedia.org/ontology/',
      demo: 'http://ex.org/demo#',
      eg: 'http://ex.org/owl#',
   },
});

// pipe to stdout
ds_writer.pipe(process.stdout);

// write some triples using a concise triples hash
ds_writer.write({
   type: 'c3r',
   value: {
      // triples about dbr:Banana
      'dbr:Banana': {
         // `a` is shortcut for rdf:type
         a: ['dbo:Plant'],

         // list of objects
         'rdfs:label': ['@en"Banana', '@fr"Banane', '@es"Plátano'],

         // nested objects are not allowed in strict-mode
         // they must be encoded as blank nodes
         'demo:steps': ['_:b0'],
      },

      '_:b0': {
         'rdf:first': ['demo:Peel'],
         'rdf:rest': ['_:b1'],
      },

      '_:b1': {
         'rdf:first': ['demo:Slice'],
         'rdf:rest': ['_:b2'],
      },

      '_:b2': {
         'rdf:first': ['demo:distribute'],
         'rdf:rest': ['rdf:nil'],
      },
   },
});

// end the writable side of the transform
ds_writer.end();
```

**Outputs:**
```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix dbr: <http://dbpedia.org/resource/> .
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix demo: <http://ex.org/demo#> .
@prefix eg: <http://ex.org/owl#> .

dbr:Banana a dbo:Plant ;
   rdfs:label "Banana"@en, "Banane"@fr, "Plátano"@es ;
   demo:steps _:b0 .

_:b0 rdf:first demo:Peel ;
   rdf:rest _:b1 .

_:b1 rdf:first demo:Slice ;
   rdf:rest _:b2 .

_:b2 rdf:first demo:distribute ;
   rdf:rest rdf:nil .


```

----

<a name="hash_c3" />

### `#hash/c3` -- Concise Triples Hash (full-mode)
Extends the strict-mode version by allowing the use of [directives](core.data.factory#writer-directives) in keys (such as embedded comments, newlines, etc.), as well as more flexible ways to write RDF objects including nested blank nodes, list structures, collections, extensible coercible type (e.g., instances of `Date` and `Number`), and strings.

A concise triples hash describes a plain object whose keys represent the *subject* of a set of triples, and whose values are [concise pair hashes](#hash_c2), which represent the objects, list structures, collections, or nested blank nodes related to the subject/predicate combination in a tree-like structure.

**Example:**
```js
// snippets/concise-triples.js
const factory = require('@graphy/core.data.factory');
const ttl_write = require('@graphy/content.ttl.write');

// create a Turtle content writer
let ds_writer = ttl_write({
   prefixes: {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      owl: 'http://www.w3.org/2002/07/owl#',
      dbr: 'http://dbpedia.org/resource/',
      dbo: 'http://dbpedia.org/ontology/',
      demo: 'http://ex.org/demo#',
      eg: 'http://ex.org/owl#',
   },
});

// pipe to stdout
ds_writer.pipe(process.stdout);

// write some triples using a concise triples hash
ds_writer.write({
   type: 'c3',
   value: {
      // triples about dbr:Banana
      [factory.comment()]: 'hey look, a comment!',
      'dbr:Banana': {
         // `a` is shortcut for rdf:type
         a: 'dbo:Plant',

         // primitive ES types map to XSD datatypes
         'eg:boolean': true,
         'eg:integer': 42,
         'eg:decimal': 0.1,
         'eg:infinity': Infinity,

         // list of objects
         'rdfs:label': ['@en"Banana', '@fr"Banane', '@es"Plátano'],

         // nested array becomes an RDF collection
         'demo:steps': [
            ['demo:Peel', 'demo:Slice', 'demo:distribute'],
         ],
      },

      // example from OWL 2 primer: https://www.w3.org/TR/owl2-primer/#Property_Restrictions
      [factory.comment()]: 'hey look, another comment!',
      'eg:HappyPerson': {
         a: 'owl:Class',

         // nesting an anonymous blank node
         'owl:equivalentClass': {
            a: 'owl:Class',

            // a list of objects
            'owl:intersectionOf': [
               [
                  // nested anonymous blank node
                  {
                     a: 'owl:Restriction',
                     'owl:onProperty': 'eg:hasChild',
                     'owl:allValuesFrom': 'eg:Happy',
                  },
                  // another nested anonymous blank node
                  {
                     a: 'owl:Restriction',
                     'owl:onProperty': 'eg:hasChild',
                     'owl:someValuesFrom': 'eg:Happy',
                  },
               ],
            ],
         },
      },
   },
});

// end the writable side of the transform
ds_writer.end();
```

**Outputs:**
```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix dbr: <http://dbpedia.org/resource/> .
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix demo: <http://ex.org/demo#> .
@prefix eg: <http://ex.org/owl#> .

# hey look, a comment!
dbr:Banana a dbo:Plant ;
   eg:boolean true ;
   eg:integer 42 ;
   eg:decimal 0.1 ;
   eg:infinity "INF"^^<http://www.w3.org/2001/XMLSchema#double> ;
   rdfs:label "Banana"@en, "Banane"@fr, "Plátano"@es ;
   demo:steps (
      demo:Peel
      demo:Slice
      demo:distribute
   ) .

# hey look, another comment!
eg:HappyPerson a owl:Class ;
   owl:equivalentClass [
      rdf:type owl:Class ;
      owl:intersectionOf (
         [
            rdf:type owl:Restriction ;
            owl:onProperty eg:hasChild ;
            owl:allValuesFrom eg:Happy ;
         ]
         [
            rdf:type owl:Restriction ;
            owl:onProperty eg:hasChild ;
            owl:someValuesFrom eg:Happy ;
         ]
      ) ;
   ] .


```

----

<a name="hash_c2r" />

### `#hash/c2r` -- Concise Pairs Hash (strict-mode)
A concise pairs hash **in strict-mode** describes a plain object whose keys represent the *predicate* of a set of predicate/object pairs, and whose values are an Array of [`ConciseObjectItem`](#value_concise-object-item)s.

----

<a name="hash_c2" />

### `#hash/c2` -- Concise Pairs Hash (full-mode)
A concise pairs hash describes a plain object whose keys represent the *predicate* of a set of predicate/object pairs, and whose values are [ConciseObjects](#value_concise-object), which represent the objects, list structures, collections, or nested blank nodes related to the predicate in a tree-like structure.

----

## Values
Definitions for the expected types on the values supplied within concise pairs hashes in full-mode.

<a name="value_concise-object" />

### value **ConciseObject**
A value that must be one of the following types:
 - `boolean` -- represents an RDF literal with an `xsd:boolean` datatype; calls [`factory.boolean()`](core.data.factory#function_boolean) on `value`.
 - `number` -- represents an RDF literal with some numeric datatype; calls [`factory.number()`](core.data.factory#function_number) on `value` to determine the datatype IRI.
 - [`#string/c1`](#string_c1) -- represents a single RDF term such as a named node, blank node, or literal. Restrictions apply to the types of terms that can be used in certain positions according to the RDF data model.
 - [`#hash/c2`](#hash_c2) -- such that `value.constructor === Object`; represents an anonymous nested blank node, allowing you to continue nesting subtrees in the same object literal.
 - `Array<`[`ConciseObjectItem`](#value_concise-object-item)`> | Set<`[`ConciseObjectItem`](#value_concise-object-item)`>` -- represents a list of objects, each one belonging to the same graph, subject, and predicate. If an `Array` is used _within_ one of the elements here, it does so in order to represent a linked-list structure such as an RDF Collection.
 - _overridable_ `Date` -- represents an RDF literal with datatype `xsd:dateTime`; calls [`factory.dateTime()`](core.data.factory#function_date-time) on `value` to handle conversion.
 - [`GenericTerm`](core.data.factory#class_generic-term)` | `[`@RDFJS/Term`](https://rdf.js.org/#term-interface) -- a single RDF term



<a name="value_concise-object-item" />

### value **ConciseObjectItem** _extends_ [ConciseObject](#value_concise-object)
A value that expects the same types as [ConciseObject](#value_concise-object) with one overriding feature:
 - `Array<`[`ConciseObject`](#value_concise-object)`>` -- represents a list whereby each element in the array is transformed into an ordered linked-list structure using the provider's configurable `.first` and `.rest` predicates and the `.nil` object (which defaults to `rdf:first`, `rdf:rest` and `rdf:nil`, respectively, from [RDF collections](https://www.w3.org/TR/rdf11-mt/#rdf-collections)). Uses the current list serialization context to determine which predicates to use for the list structured, see the [`WriteConfig` options](content.textual#config_write) for an example of how to configure this context globally for the writer, or see the [factory.config('lists')](core.data.factory#function_config-lists) directive for an example of how to configure this context within the scope of a struct's sub-tree.


----


