const Language = require('../models/Language');
const languages = require('../data/languages');
const snubDodecahedron = require('../data/snub-dodecahedron.js');

const getPrecedingIndices = (contest, cellIndex) => {
	if (contest.id !== '4') {
		return [];
	}

	const faces = [
		...snubDodecahedron.triangles,
		...snubDodecahedron.pentagons,
	];
	const face = faces[cellIndex];

	return Array(92)
		.fill()
		.map((_, index) => index)
		.filter((index) => {
			if (index === cellIndex) {
				return false;
			}

			const testFace = faces[index];
			const sharedVertices = testFace.filter((vertice) => face.includes(vertice));

			return sharedVertices.length === 2;
		});
};

module.exports.getLanguageMap = async ({team = null, contest} = {}) => {
	const languageRecords = await Language.find({contest})
		.populate({
			path: 'solution',
			populate: {path: 'user'},
		})
		.exec();

	if (!languages[contest.id]) {
		return [];
	}

	const languageCells = languages[contest.id].map((language) => {
		if (language && language.type === 'language') {
			return Object.assign({}, language, {
				record: languageRecords.find(
					(languageRecord) => languageRecord.slug === language.slug
				),
			});
		}

		return Object.assign({}, language);
	});

	return languageCells.map((cell, index) => {
		if (cell.type === 'language') {
			const solvedTeam =
				cell.record &&
				cell.record.solution &&
				cell.record.solution.user.getTeam(contest);

			if (contest.isEnded()) {
				if (cell.record && cell.record.solution) {
					return {
						type: 'language',
						solved: true,
						team: solvedTeam,
						solution: {
							_id: cell.record.solution._id,
							size: cell.record.solution.size,
							user: cell.record.solution.user.name(),
						},
						slug: cell.slug,
						name: cell.name,
						link: cell.link,
						available: false,
					};
				}

				return {
					type: 'language',
					solved: false,
					slug: cell.slug,
					name: cell.name,
					link: cell.link,
					available: false,
				};
			}

			const precedingCells = getPrecedingIndices(contest, index).map(
				(i) => languageCells[i]
			);

			const available =
				typeof team === 'number' &&
				(cell.team === team ||
					solvedTeam === team ||
					precedingCells.some(
						(c) => c.team === team ||
							(c.record &&
								c.record.solution &&
								c.record.solution.user.getTeam(contest)) ===
								team
					));

			if (cell.record && cell.record.solution) {
				return {
					type: 'language',
					solved: true,
					team: solvedTeam,
					solution: {
						_id: cell.record.solution._id,
						size: cell.record.solution.size,
						user: cell.record.solution.user.name(),
					},
					slug: cell.slug,
					name: cell.name,
					link: cell.link,
					available,
				};
			}

			if (
				precedingCells.some(
					(c) => c.type === 'base' ||
						(c.type === 'language' && c.record && c.record.solution)
				)
			) {
				return {
					type: 'language',
					solved: false,
					slug: cell.slug,
					name: cell.name,
					link: cell.link,
					available,
				};
			}

			return {
				type: 'unknown',
			};
		} else if (cell.type === 'base') {
			return {
				type: 'base',
				team: cell.team,
			};
		}

		return {
			type: 'unknown',
		};
	});
};

module.exports.getCodeLimit = (languageId) => {
	if (languageId === 'fernando') {
		return 1024 * 1024;
	}

	if (
		[
			'unlambda',
			'blc',
			'function2d',
			'brainfuck-bfi',
			'brainfuck-esotope',
			'taxi',
		].includes(languageId)
	) {
		return 100 * 1024;
	}

	return 10 * 1024;
};

module.exports.Deferred = class Deferred {
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.nativeReject = reject;
			this.nativeResolve = resolve;
		});

		this.isResolved = false;
		this.isRejected = false;
	}

	resolve(...args) {
		this.nativeResolve(...args);
		this.isResolved = true;
	}

	reject(...args) {
		this.nativeReject(...args);
		this.isReject = true;
	}
};
