var express = require("express");
var router = express.Router();
var Path = require("path");
var Multer = require("multer");
var Storage = require("@google-cloud/storage").Storage;

const storage = new Storage({
});

const uploader = Multer({
	storage: Multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
	},
}).array("archivos");

/* GET home page. */
router.get("/", function (req, res, next) {
	res.render("index", { title: "Express" });
});

router.post("/", uploader, (req, res) => {
	let promesas = Array.from(req.files).map(f => FileUploader(f));
	Promise.all(promesas)
		.then(urls => {
			console.log(urls);
			res.json(urls);
		})
		.catch(error => {
			console.error(error);
			res.end();
		});
});

/**
 * 
 * https://medium.com/@stardusteric/nodejs-with-firebase-storage-c6ddcf131ceb
 * https://medium.com/better-programming/how-to-upload-files-to-firebase-cloud-storage-with-react-and-node-js-e87d80aeded1
 * @param {*} file 
 */
function FileUploader(file) {
	console.log(file);
	return new Promise((resolve, reject) => {
		let bucket = storage.bucket("");
		//https://stackoverflow.com/questions/13020246/remove-special-symbols-and-extra-spaces-and-replace-with-underscore-using-the-re
		let safeName = file.originalname.replace(/[^A-Z0-9]/ig, "_");
		let blob = bucket.file(`images/${safeName}`);

		const blobStream = blob.createWriteStream({
			metadata: {
				contentType: file.mimetype,
				// firebaseStorageDownloadTokens: uuidv4(),
			},
			gzip: true,
			public: true,
		});

		blobStream.on("error", (error) => {
			console.error(error);
			reject("Something is wrong! Unable to upload at the moment.");
		});

		blobStream.on("finish", () => {
			let url = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
			console.log(url);
			resolve(url);
		});
		blobStream.end(file.buffer);
	});
}

module.exports = router;
