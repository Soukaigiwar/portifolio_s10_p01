const { Router } = require("express");
const ensureAuthenticated = require("../middlewares/ensureAuthenticated");

const TagsControler = require("../controllers/TagsController");
const tagsRoutes = Router();
const tagsController = new TagsControler();

tagsRoutes.get('/', ensureAuthenticated, tagsController.index);

module.exports = tagsRoutes;
