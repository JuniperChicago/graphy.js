
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
