const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_db');
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/notes', async(req, res, next)=> {
    try {
        const SQL = `
            SELECT *
            FROM notes;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
        
    }
    catch(ex){
        next(ex); 
    }
});

app.post('/api/notes', async(req, res, next)=> {
    try {
        const SQL = `
            INSERT INTO notes(txt, ranking)
            VALUES($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.ranking]);
        res.send(response.rows);
        
    }
    catch(ex){
        next(ex); 
    }
});

app.delete('/api/notes/:id', async(req, res, next)=> {
    try {
        const SQL = `
            DELETE FROM notes
            WHERE id = $1
        `;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    }
    catch(ex){
        next(ex); 
    }
});

app.use((err, req, res, next)=> {
    res.status(err.status || 500).send({ error: err.message || err});
});


const init = async()=> {
    console.log('connecting to database');
    await client.connect();
    console.log('connected to database');
    let SQL = `
        DROP TABLE IF EXISTS notes;
        CREATE TABLE notes(
            id SERIAL PRIMARY KEY,
            txt VARCHAR(200) NOT NULL,
            ranking INTEGER DEFAULT 5 NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
    `;
    await client.query(SQL);
    console.log('tables created');
    SQL = `
        INSERT INTO notes(txt) VALUES('learn SQL');
        INSERT INTO notes(txt) VALUES('go food shopping');
        INSERT INTO notes(txt, ranking) VALUES('learn express routes', 7);
    `;
    await client.query(SQL);
    console.log('data seeded');
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> console.log(`listening on port ${port}`));
}

init();