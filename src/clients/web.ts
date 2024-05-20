import express from "express";

export const webHandler = async () => {
    console.log("Web client handler");

    const app = express();

    app.get("/", (req, res) => {
        return res.status(200).send("OK");
    });


    app.listen(process.env.PORT || 3000, () => {
        console.log("Server is running");
    });
}