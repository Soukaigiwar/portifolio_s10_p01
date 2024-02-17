const { hash, compare } = require("bcryptjs");
const AppError = require("../utils/AppError");
const knex = require("../database/knex");

class UsersController {
    async show(request, response) {
        const user_id = request.user.id;

        const usersById = await knex("users")
            .where({ id: user_id })
            .first();

        return response.status(201).json(usersById);
    };

    async create(request, response) {
        const { name, email, password } = request.body;

        const checkUserExists = await knex("users")
            .where({ email });

        if (checkUserExists.length > 0) {
            throw new AppError("Este e-email já está em uso.");
        };

        const hashedPassword = await hash(password, 8);

        await knex("users")
            .insert({
                name,
                email,
                password: hashedPassword
            });

        return response.status(201).json();
    };

    async update(request, response) {
        const { name, email, password, old_password, avatar } = request.body;
        const user_id = request.user.id;

        const user = await knex("users")
            .where({ id: user_id })
            .first();

        if (!user) { throw new AppError("Usuário não encontrado") };

        const userWithUpdatedEmail = await knex("users")
            .where({ email })
            .first();

        if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
            throw new AppError("Este e-email já está em uso.");
        };

        user.name = name ?? user.name;
        user.email = email ?? user.email;
        user.avatar = avatar ?? user.avatar;

        if (password && !old_password) {
            throw new AppError("Você precisa informar a senha antiga para alterar a senha");
        };

        if (password && old_password) {
            const checkOldPassword = await compare(old_password, user.password);

            if (!checkOldPassword) {
                throw new AppError("A senha antiga está inválida.");
            };

            user.password = await hash(password, 8);
        };

        await knex("users")
            .where({ id: user_id })
            .update({
                name,
                email,
                password: user.password,
                avatar,
                updated_at: knex.fn.now()
            });

        return response.status(200).json();
    };

    async delete(request, response) {
        const user_id = request.user.id;

        await knex("users")
            .where({ id: user_id })
            .delete();

        return response.json();
    };
};

module.exports = UsersController;
