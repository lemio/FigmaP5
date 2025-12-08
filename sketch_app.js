
let channel;

async function ConnectAbly() {
            const realtimeClient = new Ably.Realtime({
                key: '1aZF6A.gt939A:hrcPYLIfVugcTx7F0uugmetAVV3yM7ZQd2nN6gBlti0',
                clientId: 'my-first-client'
            });

            await realtimeClient.connection.once('connected');
            console.log('Made my first connection!');
            channel = realtimeClient.channels.get('scale');
        }
ConnectAbly();

OverviewScreen()
async function OverviewScreen() {
  page = await loadFigma("./FigmaExport/Overview.svg");
  FigmaButton("#Button",BreadScreen)
}
async function BreadScreen() {
  page = await loadFigma("./FigmaExport/Bread.svg");
  FigmaButton("#Button",BreadSteps);
  FigmaButton("#Back",OverviewScreen);
}
async function BreadSteps() {
  page = await loadFigma("./FigmaExport/BreadSteps.svg");
  FigmaButton("#Back",BreadScreen)
  FigmaButton("#Flour", () => {channel.publish("scale", JSON.stringify({ ingredient: "Flour", totalValue: 550 }))})
  FigmaButton("#Water", () => {channel.publish("scale", JSON.stringify({ ingredient: "Water", totalValue: 350 }))})
  FigmaButton("#Salt", () => {channel.publish("scale", JSON.stringify({ ingredient: "Salt", totalValue: 10 }))})
}
