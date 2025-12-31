import { mysqlDb } from "../server/mysql-db";
import { homePageAgents } from "../shared/mysql-schema";

async function checkAgents() {
  try {
    const agents = await mysqlDb.select().from(homePageAgents);
    console.log(`Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`- ${agent.name} (ID: ${agent.id}): imageUrl="${agent.imageUrl}"`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAgents();

