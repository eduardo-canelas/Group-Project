const { app, connectDatabase } = require("./app");

const port = Number(process.env.PORT) || 5050;

async function startServer() {
    try {
        const dbConnected = await connectDatabase();

        app.listen(port, () => {
            console.log(`Server running on port ${port}${dbConnected ? "" : " (local auth fallback active)"}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
