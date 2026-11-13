import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagsToTasks1794501260160 implements MigrationInterface {
    name = 'AddTagsToTasks1794501260160'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, UNIQUE INDEX \`IDX_d90243459a697eadb8ad56e909\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task_tags\` (\`tasksId\` int NOT NULL, \`tagsId\` int NOT NULL, INDEX \`IDX_133800413d8594e69e3c449ba2\` (\`tasksId\`), INDEX \`IDX_858daeb22a80374e11b779fc72\` (\`tagsId\`), PRIMARY KEY (\`tasksId\`, \`tagsId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`task_tags\` ADD CONSTRAINT \`FK_133800413d8594e69e3c449ba2d\` FOREIGN KEY (\`tasksId\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`task_tags\` ADD CONSTRAINT \`FK_858daeb22a80374e11b779fc72a\` FOREIGN KEY (\`tagsId\`) REFERENCES \`tags\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`task_tags\` DROP FOREIGN KEY \`FK_858daeb22a80374e11b779fc72a\``);
        await queryRunner.query(`ALTER TABLE \`task_tags\` DROP FOREIGN KEY \`FK_133800413d8594e69e3c449ba2d\``);
        await queryRunner.query(`DROP INDEX \`IDX_858daeb22a80374e11b779fc72\` ON \`task_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_133800413d8594e69e3c449ba2\` ON \`task_tags\``);
        await queryRunner.query(`DROP TABLE \`task_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_d90243459a697eadb8ad56e909\` ON \`tags\``);
        await queryRunner.query(`DROP TABLE \`tags\``);
    }

}
