const knex = require("../database/knex");
const AppError = require("../utils/AppError");

class NotesController {
    async index(request, response) {
        const user_id  = request.user.id;
        const { title, tags } = request.query;

        const titleTrimmed = title ? title.trim() : "";
        let notes;

        if (tags) {
            const filterTags = tags.split(',').map(tag => tag.trim());

            notes = await knex("tags")
                .select([
                    "notes.id",
                    "notes.title",
                    "notes.user_id",
                ])
                .where("notes.user_id", user_id)
                .whereLike("notes.title", `%${titleTrimmed}%`)
                .whereIn("name", filterTags)
                .innerJoin("notes", "notes.id", "tags.note_id")
                .orderBy("notes.title");
        } else {
            notes = await knex("notes")
                .where({ user_id })
                .whereLike("title", `%${titleTrimmed}%`)
                .orderBy("title");
        };

        const userTags = await knex("tags")
            .where({ user_id });

        const notesWithTags = notes.map(note => {
            const noteTags = userTags.filter(tag => tag.note_id === note.id);

            return {
                ...note,
                tags: noteTags
            };
        });

        return response.json(notesWithTags);
    };

    async show(request, response) {
        const { id } = request.params;
        const user_id = request.user.id;

        const note = await knex("notes")
            .where({ user_id})
            .where({ id })
            .first();

        if (!note) {
            throw new AppError("Nenhuma nota encontrada", 404);
        };

        const tags = await knex("tags")
            .where({ user_id})
            .where({ note_id: id })
            .orderBy("name");
        const links = await knex("links")
            .where({ note_id: id })
            .orderBy("created_at");

        return response.status(200).json({
            ...note,
            tags,
            links
        });
    };

    async create(request, response) {
        const { title, description, tags, links } = request.body;
        const  user_id  = request.user.id;

        const [note_id] = await knex("notes").insert({
            title,
            description,
            user_id
        });

        if (title.length === 0) {
            return response.status(400).json();
        };

        if (links.length !== 0) {
            const linksInsert = links.map(link => {
                return {
                    note_id,
                    url: link
                };
            });

            await knex("links").insert(linksInsert);
        };

        if (tags.length !== 0) {
            const tagsInsert = tags.map(name => {
                name = name.toLowerCase();
                return {
                    note_id,
                    name,
                    user_id
                };
            });

            await knex("tags").insert(tagsInsert);
        };

        return response.status(201).json();
    };

    async delete(request, response) {
        const { id } = request.params;
        const user_id = request.user.id;

        const result = await knex("notes")
            .where({ user_id })
            .where({ id }).delete();

        if (result == 0) {
            throw new AppError("Nota não encontrada.", 404);
        };

        return response.json();
    };
};

module.exports = NotesController;
