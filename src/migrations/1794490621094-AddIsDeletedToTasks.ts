import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDeletedToTasks1794490621094 implements MigrationInterface {
    name = 'AddIsDeletedToTasks1794490621094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD \`isDeleted\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP COLUMN \`isDeleted\``);
    }

}
