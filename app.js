const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbpath = path.join(__dirname, "todoApplication.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndServer();

app.get("/todos/", async (request, response) => {
  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };

  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const todoArray = await database.get(getTodoQuery);
  response.send(todoArray);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addtodoDetails = `
  INSERT INTO
    todo (id , todo , priority ,status)
   VALUES(${id} , '${todo}' , '${priority}' , '${status}');
  `;
  const deResponse = await database.run(addtodoDetails);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deletetodoDetails = `
  DELETE FROM todo
  WHERE id = ${todoId}`;
  await database.run(deletetodoDetails);
  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  let updateColumn = "";
  switch (true) {
    case todoDetails.status !== undefined:
      updateColumn = "Status";
      break;
    case todoDetails.priority !== undefined:
      updateColumn = "Priority";
      break;
    case todoDetails.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
  SELECT *
  FROM todo
  WHERE
    id = ${todoId}`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoDetails = `
  UPDATE todo
    SET
    todo = '${todo}', 
    priority ='${priority}',
    status = '${status}'
    WHERE id = ${todoId};
  `;
  await database.run(updateTodoDetails);
  response.send(`${updateColumn} Updated`);
});
