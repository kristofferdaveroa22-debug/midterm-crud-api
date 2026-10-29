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