const depcheck = require("depcheck");
const readline = require("readline");

const options = {
  ignoreDirs: ["build", "node_modules"],
  ignoreMatches: ["react-scripts"]
};

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    })
  );
}

depcheck(process.cwd(), options, async (unused) => {
  const unusedDeps = unused.dependencies;
  const unusedDevDeps = unused.devDependencies;
  const missingDeps = unused.missing;

  const hasIssue =
    unusedDeps.length ||
    unusedDevDeps.length ||
    Object.keys(missingDeps).length;

  if (!hasIssue) {
    console.log("✅ No dependency issues found.");
    process.exit(0);
  }

  console.log("\n⚠️ Dependency issues detected:\n");

  if (unusedDeps.length) {
    console.log("❌ Unused dependencies:");
    console.log(unusedDeps.join("\n"));
  }

  if (unusedDevDeps.length) {
    console.log("\n❌ Unused devDependencies:");
    console.log(unusedDevDeps.join("\n"));
  }

  if (Object.keys(missingDeps).length) {
    console.log("\n❌ Missing dependencies:");
    console.log(Object.keys(missingDeps).join("\n"));
  }

  const answer = await ask("\n❓ Continue commit anyway? (y/N): ");

  if (answer.toLowerCase() !== "y") {
    console.log("❌ Commit aborted. Please fix dependencies.");
    process.exit(1);
  } else {
    console.log("⚠️ Commit continued.");
    process.exit(0);
  }
});