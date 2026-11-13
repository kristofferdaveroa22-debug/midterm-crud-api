1. What was the most challenging part of building this API?
The most challenging part was connecting the API to the MySQL database and making sure the routes worked correctly. I also needed to make sure that the relationships between users and tasks were working properly.
2. How does TypeORM make database operations easier compared to raw SQL?
TypeORM makes database operations easier because I can use TypeScript classes and objects to interact with the database instead of writing SQL queries manually. It also helps manage entities, relationships, and CRUD operations.
3. Why is it important to exclude the password field from API responses? How did you implement this?
It is important to exclude passwords because they are sensitive information and should not be exposed to users. I implemented this in my User entity by using select: false in the password column. This prevents TypeORM from selecting the password by default. However, I also need to make sure my API responses never include passwords.
4. Describe a scenario where you would need to use database transactions instead of individual operations.
A database transaction is useful when I need to perform multiple operations that must all succeed together. For example, if I create an order and update the product stock, both operations should succeed. If one fails, the transaction can roll back the changes to prevent inconsistent data.
5. What is the difference between synchronize: true and migrations? When should you use each?
Synchronize: true automatically updates the database schema based on the entities in the code. It is useful for simple development projects, but it can cause data loss if used carelessly.

Migrations are scripts that record and apply specific database structure changes. They are safer and more controlled, especially for production projects. I should use migrations when managing changes to a real database.
6. If you had to add a Product entity with a relationship to User (a user can have many products), how would you modify the code?
First, I would create a Product.ts entity with its own columns, such as id, name, and price. Then, I would use ManyToOne in the Product entity to connect each product to one user, and OneToMany in the User entity to allow one user to have many products. I would also register the Product entity in data-source.ts and create a database migration to add the products table and its foreign key.
7. What security improvements would you make before deploying this API to production?
Before deploying the API, I would hash passwords using bcrypt instead of storing plain-text passwords. I would also add authentication and authorization, rate limiting to prevent too many requests, input validation, and proper error handling. Additionally, I would use environment variables for sensitive credentials and HTTPS to protect data during transmission.


7.1 API Documentation

API Versioning

All API endpoints are now available under the "/api/v1" prefix.

Example:

GET /api/v1/users

Old "/api" endpoints return 410 Gone and indicate that the endpoint has moved to "/api/v1".

---

New API Endpoints

Authentication

POST /api/v1/auth/login

Used to log in a user using their email and password.

User With Initial Task

POST /api/v1/users/with-initial-task

Creates a user and their first task at the same time using a TypeORM transaction.

If the task creation fails, the user creation is rolled back.

Overdue Tasks

GET /api/v1/overdue

Returns tasks where the due date is in the past and the task status is not "completed".

User Task Statistics

GET /api/v1/users/:userId/stats

Returns the total, completed, and pending tasks for a user.

User Tasks

GET /api/v1/users/:userId/tasks
POST /api/v1/users/:userId/tasks

These endpoints support task creation, filtering, pagination, and sorting.

Delete Task

DELETE /api/v1/tasks/:id

Uses soft deletion by setting "isDeleted" to "true" instead of permanently removing the task.

---

Task Filtering, Pagination, and Sorting

Tasks can be filtered by:

status
priority

Example:

GET /api/v1/users/6/tasks?status=pending&priority=high

Pagination is supported using:

page
limit

Example:

GET /api/v1/users/6/tasks?page=1&limit=10

Sorting is supported using:

sortBy
order

Example:

GET /api/v1/users/6/tasks?sortBy=title&order=ASC

---

Database Schema

User

The "users" table contains:

id
name
email
phoneNumber
password
isActive
createdAt
updatedAt

Task

The "tasks" table contains:

id
title
description
status
priority
dueDate
userId
categoryId
isDeleted
createdAt
updatedAt

Category

The "categories" table contains:

id
name

Tag

The "tags" table contains:

id
name

---

Database Relationships

User and Task

One user can have many tasks.

User 1 ──────── * Task

A task belongs to one user.

If a user is deleted, the task's "userId" is set to "NULL".

Category and Task

One category can have many tasks.

Category 1 ──────── * Task

A task can belong to one category.

Task and Tag

Tasks and tags have a Many-to-Many relationship.

Task * ──────── * Tag

A task can have multiple tags, and a tag can belong to multiple tasks.

TypeORM uses a junction table to connect the tasks and tags.

---

Computed Task Property

The Task entity has an "isOverdue" computed property.

It returns "true" when:

dueDate is in the past
AND
status is not completed

Example:

{
    "title": "Finish project",
    "status": "pending",
    "isOverdue": true
}

---

Custom Task Repository

A custom Task repository includes:

findOverdueTasks()

This method finds tasks where the due date is before today and the status is not "completed".

---

DTOs

The project uses DTOs for request body typing.

DTOs are located in:

src/dto/

The project includes:

CreateUserDto
UpdateUserDto
CreateTaskDto

---

Database Seeder

The project includes a seed script that creates:

- 5 dummy users
- 15 dummy tasks

Run the seeder with:

npm run seed

The seed script checks for existing users and tasks before inserting them, helping prevent duplicate data.

---

Other Implemented Features

The API also includes:

- Password hashing using bcrypt
- Password exclusion from API responses
- Input sanitization for task title and description
- Request logging middleware
- Database transactions
- Custom Task repository
- Soft delete
- Pagination
- Sorting
- Filtering
- API versioning
- Graceful shutdown
- Environment-specific database configuration
- TypeORM migrations