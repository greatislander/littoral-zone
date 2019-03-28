workflow "Run tests" {
  on = "push"
  resolves = ["Run test"]
}

action "Install" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  runs = "npm ci"
}

action "Run test" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["Install"]
  runs = "npm run test"
}
