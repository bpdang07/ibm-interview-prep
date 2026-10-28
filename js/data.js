// All study content lives here so it's easy to edit without touching the app logic.
window.PREP = {};

/* --------------------------------------------------------------------------
   Flashcards: answers are written the way you'd say them out loud
   -------------------------------------------------------------------------- */
PREP.cards = [
  // Cloud basics
  { c: 'Cloud basics', q: 'IaaS vs PaaS vs SaaS?', a: 'IaaS rents raw infrastructure (VMs, storage, networks) and you manage the OS and up, like EC2 or IBM Cloud Virtual Servers. PaaS gives you a managed runtime and you bring code, like Cloud Run or Code Engine. SaaS is finished software like Gmail. The tradeoff is control versus how much you have to operate.' },
  { c: 'Cloud basics', q: 'Public vs private vs hybrid vs multicloud?', a: 'Public is shared provider infrastructure. Private is dedicated to one organization, on-prem or hosted. Hybrid connects private/on-prem with public cloud so workloads can run in either. Multicloud means using more than one public provider. <strong>Hybrid cloud is IBM\'s core strategy</strong>, with Red Hat OpenShift as the consistent platform across all of them.', you: 'Regulated clients like the VA keep tight control of some systems, which is exactly why hybrid matters.' },
  { c: 'Cloud basics', q: 'Why wouldn\'t a company move everything to public cloud?', a: 'Regulations and data residency, latency to systems that stay on-prem, existing investments like mainframes, cost at steady high utilization, and lock-in concerns. That\'s the case for hybrid.' },
  { c: 'Cloud basics', q: 'Regions vs availability zones?', a: 'A region is a geographic area. Availability zones are isolated data centers inside a region with independent power and networking. Spread across zones for high availability, and across regions for disaster recovery or lower latency for users.' },
  { c: 'Cloud basics', q: 'Scalability vs elasticity?', a: 'Scalability is the ability to handle more load, either vertically (a bigger machine) or horizontally (more machines). Elasticity is scaling up <em>and down</em> automatically with demand, so you only pay for what you use.' },
  { c: 'Cloud basics', q: 'High availability vs disaster recovery?', a: 'HA keeps the service running through component failures with redundancy, load balancing and multiple zones. DR is recovering from a big event like a region outage or data loss, using backups and replicas. DR is measured by RTO (how fast you recover) and RPO (how much data you can afford to lose).' },
  { c: 'Cloud basics', q: 'What is the shared responsibility model?', a: 'The provider secures the cloud itself: buildings, hardware, hypervisor. You secure what you put in it: data, identities and access, application code, configuration, and the OS if it\'s IaaS. The more managed the service, the more the provider handles.' },
  { c: 'Cloud basics', q: 'What is serverless, and what are the tradeoffs?', a: 'You run functions or containers without managing servers. It scales to zero and you pay per use (Lambda, Cloud Run, IBM Cloud Code Engine). Tradeoffs: cold starts, execution time limits, harder local debugging, and at high steady load it can cost more than always-on servers.' },
  { c: 'Cloud basics', q: 'Virtual machines vs containers?', a: 'A VM virtualizes hardware and runs its own full OS: heavier, slower to boot, strong isolation. Containers share the host kernel and package just the app and its dependencies, so they\'re lightweight and start in seconds. Isolation comes from Linux namespaces and cgroups.' },
  { c: 'Cloud basics', q: 'Stateless vs stateful services?', a: 'A stateless service keeps nothing between requests in its own memory or disk, so any instance can serve any request and you scale by adding copies. State lives in a database, cache or object storage instead. Stateful services like databases and queues need stable storage and identity, which makes scaling and failover harder.', you: 'SurgiMatch\'s FastAPI backend is stateless: JWTs for auth, data in PostgreSQL.' },
  { c: 'Cloud basics', q: 'How would you cut a cloud bill?', a: 'Find where the money goes first: tag resources by team and app and read the cost reports. Then right-size over-provisioned instances, autoscale and scale to zero where you can, shut dev environments down at night, delete idle disks, IPs and snapshots, move cold data to cheaper storage tiers, and buy reserved or committed-use pricing for steady workloads. Spot or preemptible instances suit batch jobs that can be interrupted.' },
  { c: 'Cloud basics', q: 'What is vendor lock-in, and how do you reduce it?', a: 'Depending so much on one provider\'s proprietary services that leaving becomes expensive. Reduce it with containers and Kubernetes or OpenShift as a portable runtime, Terraform for infrastructure, open-source databases, standard APIs like S3-compatible storage, and provider-specific code kept behind your own interfaces. It\'s a tradeoff: proprietary managed services can save a lot of work.' },

  // AWS: what each service is, how you use it, and how the pieces connect
  { c: 'AWS', q: 'What is AWS Lambda?', a: 'Serverless functions. You upload a handler function and AWS runs it whenever an event arrives, scaling from zero to thousands of copies and billing per request and per millisecond of run time. Each call gets an <code>event</code> (what happened) and a <code>context</code> (runtime info). Limits to know: up to 15 minutes per invocation and up to 10 GB of memory, with CPU scaling up alongside memory.', you: 'VetsEZ runs on AWS, so expect follow-ups on how Lambda or containers fit your team\'s setup.' },
  { c: 'AWS', q: 'How do you build and deploy a Lambda function?', a: 'Write a handler, like <code>def handler(event, context)</code> in Python. Give the function an execution role (an IAM role) with only the permissions it needs, plus access to CloudWatch Logs. Package the code as a zip or a container image and deploy it with the console, the AWS CLI, SAM, CDK or Terraform. Then attach a trigger: an API Gateway route, an S3 event, an SQS queue or an EventBridge schedule. Settings like table names go in environment variables; secrets come from Secrets Manager. There\'s a worked example under "Lambda in practice" below.' },
  { c: 'AWS', q: 'What can trigger a Lambda function?', a: 'Synchronous callers wait for the answer: API Gateway, an Application Load Balancer, or a direct invoke from the SDK. Asynchronous sources hand over the event and move on: S3 uploads, SNS messages, EventBridge rules and schedules. Poll-based sources are read for you in batches: SQS queues, DynamoDB Streams and Kinesis. For async and poll-based sources, set up retries and a dead-letter queue or failure destination for events that keep failing.' },
  { c: 'AWS', q: 'What is a Lambda cold start, and how do you reduce it?', a: 'The first request to a new copy of a function waits while AWS creates the environment, loads your code and runs the initialization code outside the handler. Later requests reuse that warm copy. Reduce it with smaller packages and fewer dependencies, by creating SDK clients and database connections outside the handler so they\'re reused, with provisioned concurrency for latency-sensitive endpoints, and with SnapStart (Java, Python and .NET).' },
  { c: 'AWS', q: 'What is Lambda concurrency?', a: 'How many copies of a function run at the same moment; each copy handles one request at a time. Each account has a regional limit (1,000 by default, and it can be raised). Reserved concurrency caps one function so it can\'t starve the others or flood a database; provisioned concurrency keeps copies warm. Requests beyond the limit are throttled, which callers see as 429 errors.' },
  { c: 'AWS', q: 'When would you not use Lambda?', a: 'Jobs longer than 15 minutes, steady high traffic where always-on containers or instances cost less, workloads that need GPUs, apps that hold long-lived connections, or latency-critical paths where cold starts hurt. Then reach for ECS on Fargate or EC2, or use Step Functions to split long work into steps.' },
  { c: 'AWS', q: 'What is Amazon API Gateway?', a: 'A managed front door for APIs. It receives HTTPS requests and handles routing, authentication (IAM, Cognito, JWT or custom Lambda authorizers), throttling and CORS, then passes each request to a backend: usually Lambda, but also HTTP services or other AWS services. HTTP APIs are the cheaper, simpler type; REST APIs add usage plans, API keys and request validation; WebSocket APIs keep two-way connections open.' },
  { c: 'AWS', q: 'What is S3, and how is it organized?', a: 'Object storage: files (objects) live in buckets and are addressed by a key, like <code>uploads/2026/report.pdf</code>. It\'s designed for eleven nines of durability and scales without limit. Storage classes trade cost for access speed (Standard, Infrequent Access, Glacier), and lifecycle rules move or delete old objects automatically. Buckets are private by default: keep Block Public Access on and share files with pre-signed URLs or through CloudFront.' },
  { c: 'AWS', q: 'How do S3 events connect to other services?', a: 'A bucket can send an event whenever an object is created or deleted, to Lambda, SQS, SNS or EventBridge. A common flow: the user uploads with a pre-signed URL, the event lands in an SQS queue, and a Lambda function processes the file (resize it, scan it, extract text) and saves the results to DynamoDB. The queue absorbs spikes and retries failures. See "Process uploads with S3 events" on the Design tab.' },
  { c: 'AWS', q: 'What is DynamoDB?', a: 'A fully managed NoSQL key-value and document database with single-digit-millisecond reads at any scale and no servers to run. Every item has a partition key and optionally a sort key, and you can only query efficiently by key, so you design the table around your access patterns; global secondary indexes add other ways to look items up. Capacity is on-demand or provisioned. DynamoDB Streams emits every change, which can trigger a Lambda.' },
  { c: 'AWS', q: 'DynamoDB vs RDS: how do you choose?', a: 'RDS (or Aurora) for relational data that needs joins, transactions across tables and ad-hoc queries. DynamoDB when the access patterns are known and simple (get by key, query a key range), you need huge scale with steady low latency, or you\'re fully serverless and don\'t want to manage database connections.', you: 'SurgiMatch\'s nurses, surgeries and assignment link tables are relational, so PostgreSQL on RDS is the natural fit.' },
  { c: 'AWS', q: 'What is RDS, and what is Aurora?', a: 'RDS runs managed relational databases (PostgreSQL, MySQL, MariaDB, SQL Server, Oracle): AWS handles provisioning, patching, backups and failover. Multi-AZ keeps a standby in another zone that takes over automatically; read replicas spread read traffic. Aurora is AWS\'s own MySQL- and PostgreSQL-compatible engine, with storage copied across three zones, faster failover and up to 15 read replicas.' },
  { c: 'AWS', q: 'SQS vs SNS vs EventBridge?', a: 'SQS is a queue: messages wait until one consumer pulls and deletes them, which decouples a producer from a slower worker. SNS is pub/sub: each message is pushed to every subscriber (Lambda, SQS, email, HTTPS). EventBridge is an event bus: services publish events and rules route each one by its content to targets, including AWS service events and schedules. A classic combination is SNS fanning out to several SQS queues, so each service processes at its own pace.' },
  { c: 'AWS', q: 'Standard vs FIFO SQS queues? What is a dead-letter queue?', a: 'Standard queues have nearly unlimited throughput but deliver at least once and not always in order, so consumers must be idempotent. FIFO queues keep order and process exactly once within a message group, at lower throughput. While a worker handles a message it\'s hidden for the visibility timeout; if it isn\'t deleted in time, it comes back for another try. After a set number of failures it moves to a dead-letter queue, so one bad message can\'t loop forever. Put an alarm on the DLQ.' },
  { c: 'AWS', q: 'What is Step Functions?', a: 'A managed workflow service. You define the steps as a state machine (call a Lambda, wait, branch, run steps in parallel, retry with backoff, catch errors) and it tracks every run visually. Use it to coordinate multi-step processes like an order flow or a document pipeline, instead of Lambdas calling each other directly.' },
  { c: 'AWS', q: 'What is EC2, and what are its main pieces?', a: 'Virtual machines. You launch an instance from an AMI (an image with the OS and software), pick an instance type (CPU, memory, network), attach EBS volumes as disks, and place it in a VPC subnet with a security group. Connect with SSH or Session Manager. Pricing: on-demand, Savings Plans or Reserved Instances for steady use, and Spot for cheap capacity that can be interrupted.' },
  { c: 'AWS', q: 'What is an Auto Scaling group?', a: 'A set of EC2 instances AWS keeps at a desired size, launched from a launch template. It replaces unhealthy instances and scales out or in by policy, like keeping average CPU near 50%. Put it behind a load balancer across several availability zones and you get self-healing, horizontally scaled servers.' },
  { c: 'AWS', q: 'Application Load Balancer vs Network Load Balancer?', a: 'The ALB works at layer 7: it understands HTTP, routes by path, host or header to target groups (EC2 instances, containers, IP addresses or Lambda), terminates TLS and supports WebSockets. The NLB works at layer 4 for TCP and UDP: huge throughput, very low latency and static IP addresses. Both health-check their targets and spread traffic across zones.' },
  { c: 'AWS', q: 'Walk me through an AWS VPC.', a: 'A VPC is your private network in one region, with an address range like 10.0.0.0/16. You split it into subnets in each availability zone. Public subnets route to an internet gateway and hold load balancers and NAT gateways; private subnets don\'t, and hold app servers and databases. Private servers reach the internet outbound through a NAT gateway. Security groups are stateful firewalls on each resource and network ACLs are stateless rules on subnets. VPC endpoints let private resources reach S3 or DynamoDB without the internet.' },
  { c: 'AWS', q: 'Security group vs network ACL?', a: 'Security groups attach to resources (instances, load balancers, databases), only have allow rules, and are stateful: if a request is allowed in, the reply goes out automatically. Network ACLs attach to subnets, have numbered allow and deny rules, and are stateless, so return traffic needs its own rule. A good pattern: let the database\'s security group accept traffic only from the app servers\' security group, instead of from IP ranges.' },
  { c: 'AWS', q: 'How does IAM work on AWS?', a: 'Identities (users, groups and roles) get permissions from JSON policies that allow or deny actions on resources, like <code>s3:GetObject</code> on one bucket. Everything is denied unless a policy allows it, and an explicit deny always wins. People should sign in through single sign-on (IAM Identity Center) instead of long-lived access keys, and workloads should use roles.' },
  { c: 'AWS', q: 'What is an IAM role, and why use one instead of access keys?', a: 'A role is an identity with permissions that someone or something assumes temporarily, getting short-lived credentials from STS. EC2 instances, Lambda functions and ECS tasks run with roles, so no keys sit in code or config and the credentials rotate on their own. Roles also enable cross-account access and keyless CI/CD: GitHub Actions can assume a role through OIDC with no stored secrets.' },
  { c: 'AWS', q: 'ECS vs EKS vs Fargate?', a: 'ECS is AWS\'s own container orchestrator: simpler and tightly integrated with other AWS services. EKS is managed Kubernetes: standard and portable, with more to learn and run. Fargate is a serverless way to run containers for either one: you set CPU and memory per task or pod and never manage EC2 instances. Images come from ECR.' },
  { c: 'AWS', q: 'How would you deploy a containerized web app on AWS?', a: 'CI builds the image and pushes it to ECR, tagged with the commit SHA. An ECS service on Fargate runs the tasks in private subnets across two availability zones, behind an Application Load Balancer in public subnets. The database is RDS Multi-AZ in private subnets, secrets come from Secrets Manager, logs go to CloudWatch, and deploys are rolling updates (or blue-green with CodeDeploy). Route 53 points the domain at the load balancer, which uses an ACM certificate for HTTPS.' },
  { c: 'AWS', q: 'What is CloudFront, and how does it pair with S3?', a: 'AWS\'s CDN: it caches content at edge locations near your users. A common setup keeps a React build in a private S3 bucket and serves it through CloudFront using origin access control, so the bucket itself never goes public. CloudFront can also send <code>/api/*</code> to API Gateway or a load balancer, all under one domain with one ACM certificate.' },
  { c: 'AWS', q: 'What does Route 53 do?', a: 'AWS\'s DNS service. It registers domains, hosts DNS records, and routes traffic with policies: weighted (shift traffic gradually), latency-based (send users to the nearest region) and failover (switch to a backup when health checks fail). Alias records point a domain straight at AWS resources like a load balancer or CloudFront distribution.' },
  { c: 'AWS', q: 'CloudWatch vs CloudTrail?', a: 'CloudWatch is monitoring: metrics, logs (every Lambda writes to CloudWatch Logs), dashboards, and alarms that can notify through SNS or trigger scaling. CloudTrail is auditing: a record of every API call in the account, who did what and when, like "this role deleted that bucket." Performance questions go to CloudWatch; security and compliance questions go to CloudTrail.' },
  { c: 'AWS', q: 'Secrets Manager vs Parameter Store?', a: 'Both hold configuration your apps read at runtime, with IAM deciding who can read what and KMS encrypting the values. Secrets Manager is built for secrets like database passwords and API keys: it can rotate them automatically, and you pay per secret. Systems Manager Parameter Store is simpler and cheaper (standard parameters are free), good for plain settings and for secrets that don\'t need rotation.' },
  { c: 'AWS', q: 'CloudFormation vs SAM vs CDK?', a: 'CloudFormation is AWS\'s infrastructure-as-code engine: you describe resources in a YAML or JSON template and it creates, updates and deletes them together as a stack. SAM is a CloudFormation shorthand for serverless apps (functions, APIs, tables) plus a CLI to build, test locally and deploy. CDK lets you write the same infrastructure in TypeScript, Python or Java and turns it into CloudFormation. Terraform is the multi-cloud alternative.' },
  { c: 'AWS', q: 'Which AWS services handle CI/CD?', a: 'CodePipeline strings the stages together, CodeBuild runs builds and tests in containers, and CodeDeploy rolls out to EC2, ECS or Lambda with rolling, blue-green or canary strategies and automatic rollback when alarms fire. Many teams use GitHub Actions or GitLab CI instead and deploy by assuming an AWS role through OIDC.' },
  { c: 'AWS', q: 'What is Amazon Cognito?', a: 'Sign-up and sign-in for your app\'s own users. User pools store users and handle passwords, MFA and social logins, and they issue JWTs your API can verify (API Gateway can check them for you). Identity pools exchange a signed-in user for temporary AWS credentials, for example to upload straight to S3.' },
  { c: 'AWS', q: 'When would you add ElastiCache?', a: 'When the same data is read far more often than it changes and the database is getting hot: product catalogs, session data, leaderboards, rate-limit counters. ElastiCache runs Redis, Valkey or Memcached in memory, so reads take well under a millisecond. You still have to decide how stale cached data may be and when to invalidate it.' },
  { c: 'AWS', q: 'What is AWS GovCloud?', a: 'Isolated AWS regions in the US for government and regulated workloads, run by screened US citizens on US soil, with authorizations like FedRAMP High and support for rules like ITAR. Services work like regular AWS, but the accounts are separate and some services and features arrive later.', you: 'VetsEZ works in a government cloud, so be ready to say what changes there: compliance, stricter access, and change control.' },
  { c: 'AWS', q: 'Walk me through a serverless web app on AWS.', a: 'The React frontend is served from S3 through CloudFront. Users sign in with Cognito, which issues JWTs. The browser calls API Gateway, which checks the JWT and invokes Lambda functions; they read and write DynamoDB, and slow work goes onto an SQS queue for another Lambda. Files upload straight to S3 with pre-signed URLs. CloudWatch collects logs and metrics, and the whole stack is defined in SAM or CDK. When nobody is using it, nothing runs and almost nothing is billed.' },
  { c: 'AWS', q: 'How does a Lambda function reach a private RDS database?', a: 'Attach the function to the VPC (its private subnets plus a security group) and allow that security group into the database\'s security group on the database port. Each Lambda copy opens its own connections, so a traffic spike can exhaust the database\'s connection limit; put RDS Proxy in between to pool them. Read credentials from Secrets Manager. If the function also needs the internet, route it through a NAT gateway, or use VPC endpoints for AWS services.' },
  { c: 'AWS', q: 'Your API Gateway and Lambda API starts returning errors. How do you debug it?', a: 'Open the function\'s CloudWatch metrics (errors, throttles, duration) and its logs for stack traces, searching by request ID. 5xx errors usually mean the function threw an exception or returned a response in the wrong shape; a 504 means it ran past API Gateway\'s timeout (about 30 seconds by default); 429s mean throttling or a concurrency limit. Look for AccessDenied errors from a missing IAM permission, check recent deploys, and use X-Ray traces to find a slow downstream call. If it started with a deploy, roll back to the previous version first.' },

  // Containers
  { c: 'Containers', q: 'Docker image vs container?', a: 'An image is a read-only template built in layers from a Dockerfile. A container is a running instance of an image with its own thin writable layer. You can run many containers from one image.' },
  { c: 'Containers', q: 'Walk me through a Dockerfile.', a: '<code>FROM</code> a base image, <code>WORKDIR</code>, copy the dependency manifest, <code>RUN</code> the install, then copy the source, <code>EXPOSE</code> the port, and set <code>CMD</code>. Copying dependencies before source matters for layer caching, because code changes don\'t trigger a reinstall. Multi-stage builds keep the final image small.' },
  { c: 'Containers', q: 'Why containers at all?', a: 'The same image runs identically on a laptop, in CI and in production, so "works on my machine" goes away. They start fast, pack densely onto servers, and are the unit orchestrators like Kubernetes schedule.', you: 'SurgiMatch runs its whole stack (FastAPI, React, PostgreSQL, Traefik) in Docker Compose.' },
  { c: 'Containers', q: 'What is a container registry?', a: 'Where images are stored and versioned: Docker Hub, Red Hat Quay, IBM Cloud Container Registry, ECR. Tag images immutably (for example with the git commit SHA) so you can promote and roll back exact versions, and scan them for vulnerabilities.' },
  { c: 'Containers', q: 'How do you make an image smaller and safer?', a: 'Use a slim or distroless base image, multi-stage builds so compilers don\'t ship, a <code>.dockerignore</code>, fewer layers, run as a non-root user, pin versions, and scan for CVEs in CI.' },
  { c: 'Containers', q: 'CMD vs ENTRYPOINT?', a: 'ENTRYPOINT sets the executable that always runs; CMD supplies default arguments, or the default command when there\'s no ENTRYPOINT. Arguments after the image name in <code>docker run</code> replace CMD but not ENTRYPOINT. Use the exec form (<code>["python", "app.py"]</code>) so the process receives signals like SIGTERM and can shut down cleanly.' },
  { c: 'Containers', q: 'How do containers talk to each other in Docker Compose?', a: 'Compose puts the services on a shared network where each service name is a DNS name, so the backend reaches the database at <code>db:5432</code>, not localhost. Only ports listed under <code>ports:</code> are reachable from your machine. <code>depends_on</code> controls start order, not whether the dependency is actually ready, so add a healthcheck or retry.', you: 'That\'s how SurgiMatch\'s FastAPI container reaches PostgreSQL.' },
  { c: 'Containers', q: 'Bind mount vs named volume?', a: 'A bind mount maps a folder from the host into the container, handy for live code reloading in development. A named volume is storage Docker manages, for data that has to outlive the container, like a database\'s files. Without either, anything written inside the container disappears when it\'s removed.' },
  { c: 'Containers', q: 'What is Podman?', a: 'Red Hat\'s container engine. It has the same CLI as Docker (<code>podman run</code>, <code>podman build</code>), but there\'s no background daemon and it can run containers as a regular, non-root user. It ships with Red Hat Enterprise Linux and can group containers into pods, like Kubernetes.' },

  // Kubernetes & OpenShift
  { c: 'Kubernetes & OpenShift', q: 'What does Kubernetes do?', a: 'It orchestrates containers across a cluster: schedules them onto nodes, restarts failed ones, scales replicas, rolls out updates, and handles service discovery and load balancing. You declare the desired state in YAML and controllers keep reconciling reality to match it.' },
  { c: 'Kubernetes & OpenShift', q: 'Pod vs Deployment vs Service?', a: 'A Pod is the smallest unit: one or more containers sharing network and storage. A Deployment manages identical replicas of a pod and handles rolling updates and rollbacks. A Service gives those pods a stable name and IP and load-balances across them, since pods come and go.' },
  { c: 'Kubernetes & OpenShift', q: 'How do you expose an app outside the cluster?', a: 'A Service of type NodePort or LoadBalancer, or an Ingress for HTTP routing by host and path with TLS. On OpenShift you typically use a <strong>Route</strong>.' },
  { c: 'Kubernetes & OpenShift', q: 'ConfigMap vs Secret?', a: 'Both inject configuration as environment variables or files, keeping config out of the image. ConfigMaps are for non-sensitive settings, Secrets for sensitive ones. Secrets are only base64-encoded by default, so enable encryption at rest or use an external secrets manager.' },
  { c: 'Kubernetes & OpenShift', q: 'Liveness vs readiness probes?', a: 'Liveness asks "is it alive?" and Kubernetes restarts the container if it fails. Readiness asks "can it take traffic?" and the pod is pulled from the Service until it passes. There\'s also a startup probe for slow-starting apps.' },
  { c: 'Kubernetes & OpenShift', q: 'How does autoscaling work in Kubernetes?', a: 'The Horizontal Pod Autoscaler adds or removes replicas based on CPU, memory or custom metrics. The Cluster Autoscaler adds nodes when pods can\'t be scheduled. Both work better when containers have resource requests and limits set.' },
  { c: 'Kubernetes & OpenShift', q: 'Deployment vs StatefulSet?', a: 'Deployments are for stateless, interchangeable pods. StatefulSets give each pod a stable identity, ordered startup and its own persistent volume. That fits databases and queues.' },
  { c: 'Kubernetes & OpenShift', q: 'PersistentVolume vs PersistentVolumeClaim?', a: 'Container filesystems are ephemeral. A PersistentVolume is a piece of storage in the cluster; a PersistentVolumeClaim is a pod\'s request for storage. A StorageClass lets volumes be provisioned automatically when claimed.' },
  { c: 'Kubernetes & OpenShift', q: 'What is a namespace?', a: 'A way to partition one cluster into virtual clusters for teams or environments, with their own access control (RBAC) and resource quotas. In OpenShift, a "project" is a namespace with extra metadata.' },
  { c: 'Kubernetes & OpenShift', q: 'What is OpenShift, and how is it different from plain Kubernetes?', a: 'Red Hat\'s enterprise Kubernetes platform (IBM owns Red Hat). On top of Kubernetes it adds a developer web console, built-in image builds and pipelines (Tekton), Routes, an internal registry, stricter security defaults (Security Context Constraints, so containers run as non-root by default), OperatorHub, and enterprise support. It runs on-prem and on every major cloud, which is why it\'s central to IBM\'s hybrid cloud story.' },
  { c: 'Kubernetes & OpenShift', q: 'What is Helm? What is an Operator?', a: 'Helm is a package manager for Kubernetes: charts are templated YAML with values per environment, and you install, upgrade and roll back releases. An Operator is a custom controller that encodes the operational know-how for an app (install, upgrade, backup) using custom resources. OpenShift leans heavily on Operators.' },
  { c: 'Kubernetes & OpenShift', q: 'A pod is in CrashLoopBackOff. How do you debug it?', a: '<code>kubectl describe pod</code> for events, <code>kubectl logs &lt;pod&gt; --previous</code> for the crash output, and the exit code. Check for missing env vars, secrets or config, a wrong image tag, a failing probe, OOMKilled (memory limit too low), or a dependency it can\'t reach. Fix, redeploy, and roll back first if it\'s production.' },
  { c: 'Kubernetes & OpenShift', q: 'Walk me through the Kubernetes control plane.', a: 'The API server is the front door every tool talks to. etcd is the key-value store holding the cluster\'s state. The scheduler picks a node for each new pod, and the controller manager runs the loops that keep reality matching what you declared. On every worker node, the kubelet starts and watches pods through a container runtime (CRI-O on OpenShift), and kube-proxy handles Service networking.' },
  { c: 'Kubernetes & OpenShift', q: 'What are resource requests and limits?', a: 'A request is what the scheduler reserves for a container when it picks a node. A limit is the ceiling: going over the CPU limit gets the container throttled, going over the memory limit gets it OOMKilled. Requests set too low pack nodes too tightly; no limits at all lets one pod starve its neighbours.' },
  { c: 'Kubernetes & OpenShift', q: 'How does a rolling update work?', a: 'When you change a Deployment\'s image, Kubernetes creates a new ReplicaSet and gradually adds new pods while removing old ones. <code>maxSurge</code> sets how many extra pods may exist during the rollout and <code>maxUnavailable</code> how many may be down. New pods only get traffic once their readiness probe passes, and <code>kubectl rollout undo</code> goes back to the previous ReplicaSet.' },
  { c: 'Kubernetes & OpenShift', q: 'Which kubectl (or oc) commands do you use most?', a: '<code>get</code> and <code>describe</code> to inspect resources, <code>logs</code> (with <code>-f</code> or <code>--previous</code>), <code>exec -it</code> for a shell inside a container, <code>apply -f</code> to apply YAML, <code>rollout status</code> and <code>rollout undo</code>, <code>port-forward</code> to reach a pod from your machine, and <code>top</code> for resource usage. On OpenShift, <code>oc</code> does all of that plus extras like <code>oc login</code> and <code>oc new-app</code>.' },
  { c: 'Kubernetes & OpenShift', q: 'DaemonSet vs Job vs CronJob?', a: 'A DaemonSet runs one pod on every node, for log collectors and monitoring agents. A Job runs pods until a task finishes successfully, like a database migration. A CronJob creates Jobs on a schedule, like a nightly backup.' },
  { c: 'Kubernetes & OpenShift', q: 'How does RBAC work in Kubernetes?', a: 'A Role (one namespace) or ClusterRole (whole cluster) lists allowed verbs on resources, like get and list on pods. A RoleBinding or ClusterRoleBinding grants that role to a user, group or ServiceAccount. Apps in pods act as ServiceAccounts, and least privilege means each one gets only what it needs.' },

  // CI/CD & IaC
  { c: 'CI/CD & IaC', q: 'What is CI/CD?', a: 'CI: every change is merged often and automatically built and tested. CD is either continuous <em>delivery</em> (always releasable, prod deploy is a button or an approval) or continuous <em>deployment</em> (every green change goes live). The goal is small, frequent, low-risk releases.', you: 'VetsEZ uses CI/CD in a government cloud; Coup V2 had a GitLab pipeline you can describe stage by stage.' },
  { c: 'CI/CD & IaC', q: 'What stages go in a typical pipeline?', a: 'Checkout → install (cached) → lint → unit tests → build the artifact or image → security scans → push to a registry → deploy to dev/staging → integration and smoke tests → approval → production → post-deploy checks.' },
  { c: 'CI/CD & IaC', q: 'Rolling vs blue-green vs canary deployments?', a: 'Rolling replaces instances gradually. Blue-green runs the new version next to the old and switches all traffic at once, so rollback is just switching back. Canary sends a small percentage of traffic to the new version, watches metrics, then ramps up.' },
  { c: 'CI/CD & IaC', q: 'How do you roll back a bad deployment?', a: 'Redeploy the previous known-good image tag (immutable versions make this easy), <code>kubectl rollout undo</code>, flip blue-green traffic back, or turn the feature off with a flag. Database migrations need to be backward-compatible or rollback gets painful.' },
  { c: 'CI/CD & IaC', q: 'What is Infrastructure as Code?', a: 'Defining infrastructure in version-controlled files instead of clicking in a console, so it\'s reproducible, reviewable and auditable. Terraform (HashiCorp, now part of IBM) is declarative: you describe the desired state, <code>terraform plan</code> shows the diff, <code>apply</code> makes it real.' },
  { c: 'CI/CD & IaC', q: 'What is Terraform state, and why does it matter?', a: 'The state file maps your config to the real resources Terraform created. Teams store it remotely with locking so two people can\'t apply at once. It can contain sensitive values, so it has to be protected.' },
  { c: 'CI/CD & IaC', q: 'Terraform vs Ansible?', a: 'Terraform provisions infrastructure declaratively: create the network, VMs, cluster. Ansible (Red Hat) configures systems and automates tasks with YAML playbooks, agentless over SSH. They\'re often used together.' },
  { c: 'CI/CD & IaC', q: 'What is GitOps?', a: 'Git is the source of truth for what should be running. An agent like Argo CD continuously syncs the cluster to the repo, so every change goes through a pull request (review plus audit trail) and drift gets corrected automatically. OpenShift GitOps is built on Argo CD.' },
  { c: 'CI/CD & IaC', q: 'What is Tekton / OpenShift Pipelines?', a: 'Kubernetes-native CI/CD: each pipeline step runs as a container in a pod, defined with custom resources (Tasks, Pipelines). OpenShift Pipelines is Red Hat\'s Tekton offering.' },
  { c: 'CI/CD & IaC', q: 'What is a feature flag?', a: 'A switch in configuration that turns a code path on or off at runtime. It separates deploying code from releasing a feature: ship it dark, turn it on for a few users, and turn it off instantly if something breaks, with no redeploy. Remove old flags so they don\'t pile up.' },
  { c: 'CI/CD & IaC', q: 'What does DevSecOps, or "shifting security left," mean?', a: 'Building security checks into the pipeline instead of reviewing at the end: static code analysis (SAST), dependency and container image scanning for known CVEs, secret scanning, policy checks on infrastructure code, and dynamic testing (DAST) against staging. Problems show up on the pull request, when they\'re cheapest to fix.' },
  { c: 'CI/CD & IaC', q: 'Name a few 12-factor app principles.', a: 'Config in the environment, stateless processes, backing services as attached resources, dev/prod parity, logs as event streams, separate build/release/run, and fast startup with graceful shutdown. Together they make apps easy to run in the cloud.' },

  // Networking
  { c: 'Networking', q: 'What happens when you type a URL and hit enter?', a: 'The browser checks its cache, DNS resolves the domain to an IP, it opens a TCP connection plus a TLS handshake for HTTPS, and sends an HTTP request. That usually hits a CDN or load balancer, gets routed to an app server, which may call a database or cache, and returns a response the browser renders while it fetches more assets.' },
  { c: 'Networking', q: 'TCP vs UDP?', a: 'TCP is connection-oriented and reliable, with ordered delivery and retransmission (HTTP/1.1 and 2, SSH). UDP is connectionless with no delivery guarantee but lower latency (DNS, video calls, games). HTTP/3 runs on QUIC, which is built on UDP.' },
  { c: 'Networking', q: 'Common HTTP status codes?', a: '200 OK, 201 Created, 204 No Content, 301/302 redirect, 304 Not Modified, 400 Bad Request, 401 Unauthorized (not logged in), 403 Forbidden (logged in but not allowed), 404 Not Found, 409 Conflict, 429 Too Many Requests, 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.' },
  { c: 'Networking', q: 'What makes an API RESTful?', a: 'Resources addressed by URLs (<code>/nurses/42</code>), standard methods (GET read, POST create, PUT/PATCH update, DELETE), stateless requests, meaningful status codes, and JSON representations. GET, PUT and DELETE should be idempotent.' },
  { c: 'Networking', q: 'What does a load balancer do?', a: 'It spreads traffic across healthy instances (round robin, least connections), health-checks them and stops sending traffic to bad ones, and often terminates TLS. Layer 4 balances TCP connections; layer 7 understands HTTP and can route by path or host.' },
  { c: 'Networking', q: 'What is a reverse proxy?', a: 'A server in front of your apps that receives client requests and forwards them: routing, TLS termination, load balancing, compression, caching. Nginx and Traefik are common.', you: 'SurgiMatch uses Traefik as its reverse proxy.' },
  { c: 'Networking', q: 'VPC, subnets, security groups?', a: 'A VPC is your isolated private network in the cloud. Subnets are IP ranges inside it: public if they route to the internet, private if not. Security groups are stateful firewalls on instances; network ACLs work at the subnet level. Databases belong in private subnets.' },
  { c: 'Networking', q: 'What does DNS do? Name some record types.', a: 'DNS turns names into IP addresses. A and AAAA map to IPv4/IPv6, CNAME aliases one name to another, MX is for mail, TXT holds verification and policy text. The TTL controls how long resolvers cache an answer.' },
  { c: 'Networking', q: 'What does a CDN do?', a: 'It caches static content at edge locations close to users, which cuts latency and load on your origin. Configure cache headers and TTLs, and don\'t cache private content publicly.' },
  { c: 'Networking', q: 'What does CIDR notation like 10.0.0.0/16 mean?', a: 'The number after the slash is how many leading bits are fixed as the network part; the rest are for hosts. A /16 leaves 16 bits, so 65,536 addresses; a /24 leaves 8 bits, so 256. You carve a VPC\'s range, say a /16, into smaller subnets like /24s, and networks that need to connect must not overlap.' },
  { c: 'Networking', q: 'What is a NAT gateway?', a: 'It lets servers in private subnets make outbound connections, to download updates or call an outside API, without being reachable from the internet. It swaps their private addresses for its own public one.' },
  { c: 'Networking', q: 'How does TLS work, roughly?', a: 'The server presents a certificate signed by a certificate authority the client trusts, proving it owns the domain. During the handshake, the two sides use public-key cryptography to agree on a shared session key, then encrypt everything else with fast symmetric encryption. That gives privacy, integrity and server authentication. With mTLS, the client presents a certificate too.' },

  // Microservices & APIs
  { c: 'Microservices & APIs', q: 'Monolith vs microservices?', a: 'A monolith is one deployable app: simple to build, test and run at first, but harder to change and scale as it grows. Microservices split it into small services that each own their data and deploy independently, so teams move on their own and you scale only what\'s busy. The price is distributed-system complexity: network calls, monitoring, data consistency. A well-structured monolith is often the right start.' },
  { c: 'Microservices & APIs', q: 'How do microservices talk to each other?', a: 'Synchronously, with REST or gRPC calls, when the caller needs an answer right away. Asynchronously, with messages or events through a broker like Kafka or RabbitMQ, when it doesn\'t need to wait. Async decouples services and absorbs spikes but makes flows harder to follow. Either way, use timeouts, retries with backoff and tracing.' },
  { c: 'Microservices & APIs', q: 'What does an API gateway do?', a: 'It\'s the single entry point for clients. It routes each request to the right service and handles authentication, rate limiting, TLS and request logging, sometimes caching too. The services behind it stay simpler and clients see one consistent API.' },
  { c: 'Microservices & APIs', q: 'REST vs GraphQL vs gRPC?', a: 'REST: resources over HTTP and JSON, simple, cacheable and understood everywhere. GraphQL: one endpoint where the client asks for exactly the fields it needs, great for varied frontends, but caching and rate limiting get harder. gRPC: binary Protocol Buffers over HTTP/2 with generated clients, fast and strongly typed, popular between internal services.' },
  { c: 'Microservices & APIs', q: 'What is idempotency, and why does it matter?', a: 'An operation is idempotent if doing it twice has the same effect as doing it once. Networks fail and clients retry, so retrying a non-idempotent POST could charge a card twice. GET, PUT and DELETE should be idempotent; for POST, accept an idempotency key and return the original result for repeats.' },
  { c: 'Microservices & APIs', q: 'How do you version an API without breaking clients?', a: 'Prefer backward-compatible changes: add fields and endpoints, don\'t remove or rename them. When you must break something, publish a new version (<code>/v2/</code> or a version header), run both while clients migrate, announce a deprecation date, and watch who still calls the old one.' },
  { c: 'Microservices & APIs', q: 'How do you keep data consistent across microservices?', a: 'Each service owns its database, so there\'s no single transaction across services. A saga chains local transactions, each publishing an event, with compensating actions that undo earlier steps if a later one fails. Accept eventual consistency where the business allows it. The outbox pattern makes "save to the database and publish an event" reliable.' },
  { c: 'Microservices & APIs', q: 'What is a service mesh?', a: 'A layer that manages service-to-service traffic through a proxy (like Envoy) running beside each service, so the code doesn\'t have to: mTLS between services, retries and timeouts, traffic splitting for canaries, and metrics and traces for every call. Istio is the best known; OpenShift Service Mesh is based on it.' },
  { c: 'Microservices & APIs', q: 'How does rate limiting work?', a: 'Cap how many requests a client can make in a time window and answer the extras with 429 Too Many Requests, ideally with a Retry-After header. The token bucket is the common algorithm: tokens refill at a steady rate, each request spends one, and the bucket size allows short bursts. It protects services from abuse and from one noisy client.' },

  // Security
  { c: 'Security', q: 'What is the principle of least privilege?', a: 'Every user and service gets only the permissions it needs, only for as long as it needs them: scoped roles, a service identity per app, no shared admin credentials, regular access reviews. It limits the damage when something gets compromised.' },
  { c: 'Security', q: 'How should secrets be handled?', a: 'Never in source code, images or plain config files. Keep them in a secrets manager (IBM Cloud Secrets Manager, HashiCorp Vault, AWS Secrets Manager) or encrypted Kubernetes Secrets, inject them at runtime, rotate them, and scan repos for leaks.' },
  { c: 'Security', q: 'Authentication vs authorization? What is a JWT?', a: 'Authentication is who you are (login, MFA); authorization is what you\'re allowed to do (roles, permissions). A JWT is a signed token carrying claims like the user ID and an expiry, which the server verifies without a session lookup. Keep them short-lived, send them only over HTTPS, and never put secrets in the payload, because it\'s encoded, not encrypted.', you: 'SurgiMatch uses JWT auth; you moved delete-operation authorization checks into the API routes.' },
  { c: 'Security', q: 'Encryption in transit vs at rest?', a: 'In transit: TLS between clients and services, and mTLS between services. At rest: encrypted disks, databases and object storage, with keys held in a key management service. Both are baseline requirements for healthcare and government work.' },
  { c: 'Security', q: 'Name some OWASP Top 10 risks.', a: 'Broken access control, injection (SQL injection, prevented with parameterized queries), cryptographic failures, security misconfiguration, vulnerable or outdated components, authentication failures, and server-side request forgery.' },
  { c: 'Security', q: 'How do you hash passwords?', a: 'Never store them in plain text or with a fast hash like SHA-256 alone. Use a slow, salted algorithm built for passwords, like bcrypt or Argon2, so leaked hashes are expensive to crack.' },
  { c: 'Security', q: 'Symmetric vs asymmetric encryption?', a: 'Symmetric uses one shared key to encrypt and decrypt (AES): fast, good for bulk data, but the key has to be shared safely. Asymmetric uses a key pair (RSA, elliptic curve): anyone can encrypt with the public key, only the private key decrypts, and the private key can also sign. TLS uses asymmetric crypto to agree on a symmetric session key.' },
  { c: 'Security', q: 'Hashing vs encryption vs encoding?', a: 'Encoding changes the format and anyone can reverse it (Base64), which is why base64 Kubernetes Secrets aren\'t really secret. Encryption hides data and only the key reverses it (AES, RSA). Hashing is one-way: a fixed-size fingerprint you can\'t turn back into the input (SHA-256), used for integrity checks and, with a slow salted algorithm, passwords.' },
  { c: 'Security', q: 'OAuth 2.0 vs OpenID Connect?', a: 'OAuth 2.0 is about authorization: an app gets an access token to call an API on a user\'s behalf without ever seeing their password ("let this app read my calendar"). OpenID Connect adds authentication on top: an ID token that says who the user is. That\'s what "Sign in with Google" and most enterprise single sign-on use.' },
  { c: 'Security', q: 'What is zero trust?', a: 'Never trust a request because of where it comes from, like being inside the company network. Verify every request: strong identity for users and services, least privilege, mTLS between services, device checks and continuous monitoring. It assumes the network is already compromised.' },

  // Data
  { c: 'Data', q: 'SQL vs NoSQL?', a: 'SQL databases (PostgreSQL, MySQL) have schemas, relations, joins and ACID transactions, which suit structured data that has to stay consistent. NoSQL (MongoDB, key-value, wide-column) trades that for flexible schemas and easier horizontal scaling. Choose by your access patterns.', you: 'You\'ve used PostgreSQL (SurgiMatch), MySQL (Coup V2) and MongoDB.' },
  { c: 'Data', q: 'What is an index, and what does it cost?', a: 'A data structure, usually a B-tree, that speeds up lookups on columns used in WHERE, JOIN and ORDER BY. It costs extra storage and slows writes, because every insert and update has to maintain it.' },
  { c: 'Data', q: 'What does ACID mean?', a: 'Atomicity: all of a transaction or none of it. Consistency: valid state to valid state. Isolation: concurrent transactions don\'t step on each other. Durability: once committed, it survives a crash.' },
  { c: 'Data', q: 'How do you model a many-to-many relationship?', a: 'With a link (join) table: one row per pairing, holding foreign keys to both sides, often with extra columns like status, role or timestamps. Index the foreign keys.', you: 'You built assignment link tables in SurgiMatch. Use them as your example.' },
  { c: 'Data', q: 'What are database migrations?', a: 'Versioned scripts that evolve the schema alongside the code (Alembic for Python, Flyway or Liquibase for Java). They run in the pipeline. Make them backward-compatible (expand, migrate, then contract) so rolling deploys and rollbacks don\'t break.', you: 'You wrote Alembic migrations for SurgiMatch.' },
  { c: 'Data', q: 'Why use a message queue?', a: 'To decouple producers from consumers, absorb traffic spikes, move slow work into the background, and retry failures safely. Examples: RabbitMQ, Kafka, IBM MQ.' },
  { c: 'Data', q: 'What is caching, and what\'s the hard part?', a: 'Keeping frequently read data in fast storage (memory, Redis, CDN) to cut latency and load. The hard part is invalidation: deciding how stale data can be (TTLs) and updating or evicting it when the source changes.' },
  { c: 'Data', q: 'Replication vs sharding?', a: 'Replication copies the same data to several nodes: read replicas spread read load, and a standby takes over if the primary fails. Sharding splits the data across nodes by a key like customer ID, so each node holds only part of it, which scales writes and storage. Replication is far simpler; reach for sharding only when one primary can\'t keep up.' },
  { c: 'Data', q: 'What does the CAP theorem say?', a: 'When a network partition splits a distributed system, it has to choose between consistency (every read sees the latest write) and availability (every request gets an answer). Partitions will happen, so the real choice is which to give up during one. Account balances lean toward consistency; a shopping cart or social feed can favor availability with eventual consistency.' },
  { c: 'Data', q: 'What is normalization?', a: 'Organizing tables so each fact is stored once: no repeating groups, every column depends on the whole key, and no column depends on another non-key column (roughly first, second and third normal form). It prevents update anomalies. You sometimes denormalize on purpose, duplicating data so heavy reads are faster.' },

  // Reliability
  { c: 'Reliability', q: 'Logs vs metrics vs traces?', a: 'Logs are detailed event records. Metrics are numeric time series (latency, error rate, CPU) for dashboards and alerts. Traces follow a single request across services to show where the time goes. Together they\'re observability. Tools: Prometheus and Grafana, the ELK stack, OpenTelemetry, IBM Instana.' },
  { c: 'Reliability', q: 'SLI vs SLO vs SLA?', a: 'An SLI is a measurement, like the percentage of requests under 300 ms. An SLO is the internal target, like 99.9% a month. An SLA is the contractual promise to customers, with penalties. The error budget is 100% minus the SLO: how much failure you can spend on shipping changes.' },
  { c: 'Reliability', q: 'Users say the app is slow. What do you do?', a: 'Confirm and scope it (who, since when, which endpoints), then check dashboards: latency, errors, CPU and memory, DB query times. Look at recent deploys or changes and use traces to find the slow hop. Mitigate first (scale out or roll back), then fix the root cause and write a blameless postmortem.' },
  { c: 'Reliability', q: 'Retries, backoff and circuit breakers?', a: 'Retry transient failures with exponential backoff plus jitter so clients don\'t stampede. Only retry idempotent operations. A circuit breaker stops calling a failing dependency for a while, so one broken service doesn\'t cascade into everything.' },
  { c: 'Reliability', q: 'What would you put on a dashboard for a web service?', a: 'The four golden signals: latency (how long requests take, especially the slowest 5% and 1%), traffic (requests per second), errors (the rate of failed requests) and saturation (how full CPU, memory, connections or queues are). Alert on what users feel, like errors and latency, rather than every CPU spike.' },

  // Linux & Git
  { c: 'Linux & Git', q: 'Which Linux commands would you use to debug a server?', a: '<code>top</code>/<code>htop</code> and <code>ps</code> for processes, <code>df -h</code> and <code>du</code> for disk, <code>free -m</code> for memory, <code>journalctl</code> and <code>tail -f</code> for logs, <code>grep</code>, <code>curl</code> to test endpoints, <code>ss -tulpn</code> for open ports, <code>systemctl status</code>, and <code>chmod</code>/<code>chown</code> for permissions.' },
  { c: 'Linux & Git', q: 'git merge vs rebase?', a: 'Merge adds a merge commit and keeps both histories as they happened. Rebase replays your commits on top of another branch for a linear history. Never rebase a branch others are using. Typical flow: feature branch → pull request → review → CI → merge.' },
  { c: 'Linux & Git', q: 'What do file permissions like 755 mean?', a: 'Three digits for owner, group and others; each digit adds read (4), write (2) and execute (1). 755 means the owner can read, write and execute, and everyone else can read and execute.' },
  { c: 'Linux & Git', q: 'How do you find and stop whatever is using a port?', a: '<code>lsof -i :8080</code> or <code>ss -tulpn | grep 8080</code> shows the process and its PID. <code>kill PID</code> sends SIGTERM, asking it to stop and clean up; <code>kill -9 PID</code> (SIGKILL) forces it and should be the last resort. If it\'s a system service, use <code>systemctl stop</code> instead.' },
  { c: 'Linux & Git', q: 'git revert vs git reset?', a: '<code>git revert</code> adds a new commit that undoes an earlier one, so history stays intact and it\'s safe on shared branches. <code>git reset</code> moves your branch back, rewriting history (<code>--soft</code> keeps the changes staged, <code>--hard</code> throws them away). Only reset commits nobody else has pulled.' },
  { c: 'Linux & Git', q: 'How do SSH keys work?', a: 'You generate a key pair. The public key goes on the server (in <code>~/.ssh/authorized_keys</code>) or on GitHub; the private key never leaves your machine. When you connect, the server sends a challenge only your private key can answer, so no password crosses the network. Protect the private key with a passphrase and permissions of 600.' },

  // CS fundamentals
  { c: 'CS fundamentals', q: 'Process vs thread?', a: 'A process has its own memory space. Threads live inside a process and share its memory: cheaper to create and switch, but shared state needs synchronization like locks.' },
  { c: 'CS fundamentals', q: 'What is a race condition, and how do you prevent it?', a: 'When the result depends on the timing of concurrent access to shared state. Prevent it with locks or mutexes, atomic operations, immutable data, or by not sharing state at all (message passing).' },
  { c: 'CS fundamentals', q: 'How does a hash table work?', a: 'A hash function maps each key to a bucket. Collisions are handled by chaining or open addressing. Lookups average O(1) but degrade to O(n) with many collisions, so the table resizes when its load factor gets high.' },
  { c: 'CS fundamentals', q: 'The four OOP principles?', a: 'Encapsulation (hide internal state behind methods), abstraction (expose what something does, not how), inheritance (reuse behavior from a parent), and polymorphism (one interface, many implementations).' },
  { c: 'CS fundamentals', q: 'Stack vs heap memory?', a: 'The stack holds function call frames and local variables per thread: automatic, fast, limited in size. The heap holds dynamically allocated objects, shared across the program and cleaned up by the garbage collector in Java and Python.' },
  { c: 'CS fundamentals', q: 'Concurrency vs parallelism?', a: 'Concurrency is structuring a program to make progress on several tasks at once, like an async server juggling many requests while it waits on I/O. Parallelism is actually running tasks at the same instant on multiple cores. In Python, asyncio gives you concurrency and multiprocessing gives you parallelism.' },
  { c: 'CS fundamentals', q: 'What is a deadlock, and how do you avoid one?', a: 'Two or more threads each hold a lock the other needs, so they all wait forever. Avoid it by always taking locks in the same order, holding them as briefly as possible, or using timeouts when acquiring them.' },

  // IBM Cloud
  { c: 'IBM Cloud', q: 'What is IBM Cloud Code Engine?', a: 'IBM\'s fully managed serverless platform. You give it a container image, source code or a batch job, and it runs and scales it (down to zero) without you managing a cluster.' },
  { c: 'IBM Cloud', q: 'IBM Cloud Kubernetes Service vs Red Hat OpenShift on IBM Cloud?', a: 'Both are managed clusters where IBM runs the control plane. The Kubernetes Service is upstream Kubernetes; Red Hat OpenShift on IBM Cloud adds everything OpenShift brings (console, Routes, pipelines, Operators, stricter security defaults). Pick OpenShift for hybrid consistency or if the client already uses it.' },
  { c: 'IBM Cloud', q: 'How is access managed on IBM Cloud?', a: 'Through IAM: users and service IDs (with API keys for apps) get access via policies, usually through access groups. Platform roles (Viewer, Editor, Administrator) control managing resources; service roles (Reader, Writer, Manager) control using them. Resource groups organize what policies apply to.' },
  { c: 'IBM Cloud', q: 'What is IBM Cloud Object Storage?', a: 'Durable, scalable storage for unstructured data like files, backups and logs. It supports an S3-compatible API, and storage classes let you trade access speed for cost.' },
  { c: 'IBM Cloud', q: 'What is IBM Cloud Satellite?', a: 'It lets you run IBM Cloud services, like Red Hat OpenShift clusters and databases, in your own data center, at the edge or on another cloud, while managing them all from IBM Cloud. It\'s IBM\'s hybrid cloud strategy turned into a product.' },
  { c: 'IBM Cloud', q: 'What is IBM Cloud Schematics?', a: 'Terraform (and Ansible) as a managed service. You point it at a Git repo of Terraform code and it runs plan and apply for you, stores the state, and keeps access control and a history of every change.' },
  { c: 'IBM Cloud', q: 'Which IBM Cloud data services should you know?', a: 'Databases for PostgreSQL, MongoDB and Redis (managed open-source databases), Cloudant (a managed NoSQL document database built on Apache CouchDB), Db2 (IBM\'s relational database), and Event Streams (managed Apache Kafka).' }
];

/* --------------------------------------------------------------------------
   AWS ↔ Google Cloud ↔ IBM Cloud
   -------------------------------------------------------------------------- */
PREP.serviceMap = [
  ['Virtual machines', 'EC2', 'Compute Engine', 'Virtual Servers for VPC'],
  ['Managed Kubernetes', 'EKS', 'GKE', 'Kubernetes Service · Red Hat OpenShift on IBM Cloud'],
  ['Serverless', 'Lambda · Fargate', 'Cloud Run', 'Code Engine'],
  ['Object storage', 'S3', 'Cloud Storage', 'Cloud Object Storage'],
  ['Managed PostgreSQL', 'RDS · Aurora', 'Cloud SQL', 'Databases for PostgreSQL'],
  ['Container registry', 'ECR', 'Artifact Registry', 'Container Registry'],
  ['Secrets', 'Secrets Manager', 'Secret Manager', 'Secrets Manager'],
  ['Infrastructure as code', 'CloudFormation · Terraform', 'Terraform', 'Terraform (HashiCorp is part of IBM)'],
  ['Monitoring / APM', 'CloudWatch', 'Cloud Monitoring', 'Cloud Monitoring · Instana'],
  ['NoSQL database', 'DynamoDB', 'Firestore', 'Cloudant'],
  ['Message queue', 'SQS', 'Pub/Sub · Cloud Tasks', 'IBM MQ'],
  ['Event streaming', 'Kinesis · MSK (Kafka)', 'Pub/Sub · Managed Kafka', 'Event Streams (Kafka)'],
  ['API gateway', 'API Gateway', 'API Gateway · Apigee', 'API Connect'],
  ['App user sign-in', 'Cognito', 'Identity Platform', 'App ID'],
  ['Encryption keys', 'KMS', 'Cloud KMS', 'Key Protect']
];

/* --------------------------------------------------------------------------
   System design / scenario questions
   -------------------------------------------------------------------------- */
PREP.scenarios = [
  {
    id: 'deploy', diagram: 'arch',
    title: 'Deploy SurgiMatch to the cloud',
    prompt: 'SurgiMatch runs in Docker Compose on your laptop: a React frontend, a FastAPI backend and PostgreSQL. How would you run it in the cloud for real hospitals?',
    clarify: ['How many hospitals and users? Any traffic peaks, like shift changes?', 'Is any of it health data? That drives encryption, audit logging and region choice.', 'Budget and team size: managed services, or run things ourselves?'],
    steps: [
      '<strong>Images:</strong> CI builds the frontend and backend into container images and pushes them to a registry, tagged with the commit SHA.',
      '<strong>Runtime:</strong> run the backend on managed Kubernetes or OpenShift as a Deployment with 2+ replicas behind a Service, or on Code Engine for something simpler to operate.',
      '<strong>Frontend:</strong> build React to static files and serve them from object storage plus a CDN, or from a small nginx container.',
      '<strong>Database:</strong> replace the Postgres container with a managed PostgreSQL service: automated backups, encryption at rest, private endpoint only.',
      '<strong>Secrets:</strong> the database URL and JWT secret come from a secrets manager at runtime, never baked into images.',
      '<strong>Traffic:</strong> an Ingress or OpenShift Route terminates TLS and sends <code>/api</code> to the backend and everything else to the frontend.',
      '<strong>Migrations:</strong> run Alembic as a one-off job in the pipeline before the new backend version rolls out.',
      '<strong>Pipeline:</strong> merge → tests → build images → vulnerability scan → deploy to staging → smoke tests → approval → rolling update to production.',
      '<strong>Operate:</strong> liveness/readiness probes, autoscaling on CPU, centralized logs, and alerts on error rate and latency.'
    ],
    tradeoffs: ['A managed database costs more than a container but takes backups, patching and failover off your plate. Almost always worth it.', 'Kubernetes/OpenShift gives control and portability; Code Engine is simpler but less flexible.', 'Keep the backend stateless (JWTs for sessions, files in object storage) so it scales horizontally.']
  },
  {
    id: 'pipeline', diagram: 'pipe',
    title: 'Design a CI/CD pipeline for a new microservice',
    prompt: 'Your team is starting a new microservice. Design its CI/CD pipeline from pull request to production.',
    clarify: ['What does it run on (OpenShift, Code Engine, VMs)?', 'How regulated is it? Do production deploys need a human approval?'],
    steps: [
      '<strong>Trigger:</strong> every pull request runs CI; merges to main run CI plus CD.',
      '<strong>CI:</strong> install dependencies (cached) → lint → unit tests → build the image → scan dependencies and the image.',
      '<strong>Artifact:</strong> push one image tagged with the commit SHA and promote that same image through every environment.',
      '<strong>Staging:</strong> deploy automatically and run integration and smoke tests against it.',
      '<strong>Production:</strong> approval gate (or automatic on green), then a rolling or canary rollout with health checks.',
      '<strong>Rollback:</strong> redeploy the previous image tag automatically if health checks fail.',
      '<strong>Config &amp; infra:</strong> per-environment config and secrets injected at deploy; infrastructure in Terraform, reviewed like code.',
      '<strong>Feedback:</strong> notify on failure and keep the whole thing under about 10 minutes.'
    ],
    tradeoffs: ['Continuous deployment ships faster; a manual gate adds safety for regulated systems like VetsEZ.', 'On OpenShift, the Red Hat-native version is OpenShift Pipelines (Tekton) for CI plus OpenShift GitOps (Argo CD) for CD.']
  },
  {
    id: 'debug',
    title: 'It works locally but fails after deploy',
    prompt: 'Your change passed every test locally, but after deploying, the service returns 500 errors. Walk me through what you do.',
    clarify: ['Is it all users or some? Since exactly when?', 'What changed in this deploy: code, config, dependencies, infrastructure?'],
    steps: [
      '<strong>Mitigate first:</strong> if users are affected, roll back to the last good version, then debug calmly.',
      '<strong>Read the logs:</strong> application logs for the stack trace, pipeline logs for build or deploy warnings.',
      '<strong>Diff the environments:</strong> env vars and secrets present? Config values? Dependency versions (lock file)? Image architecture? File paths and permissions?',
      '<strong>Check connectivity:</strong> can it reach the database and other APIs (DNS, firewall or network policy, credentials)?',
      '<strong>Reproduce:</strong> run the exact same image with production-like config in staging.',
      '<strong>Prevent it:</strong> fix, then add a test, a startup config check or a pipeline step so it can\'t happen again.'
    ],
    tradeoffs: ['This is why we ship containers: the same image everywhere, only config differs.', 'Rolling back fast beats debugging live in production.']
  },
  {
    id: 'scale',
    title: 'Traffic jumps 10× overnight',
    prompt: 'A news story mentions the app and traffic jumps 10× overnight. Pages are slow and some requests time out. What do you do?',
    clarify: ['Which part is slow: app servers, database, an external API?', 'Is the spike temporary or the new normal?'],
    steps: [
      '<strong>Measure first:</strong> CPU and memory per service, latency per endpoint, DB connections and slow queries, error rates.',
      '<strong>Scale out the stateless tier:</strong> more replicas behind the load balancer, plus autoscaling so the next spike is handled automatically.',
      '<strong>Protect the database:</strong> connection pooling, missing indexes, read replicas for read-heavy traffic, a cache like Redis for hot reads.',
      '<strong>Offload:</strong> static assets to a CDN, slow work (emails, reports) to a queue with background workers.',
      '<strong>Protect the system:</strong> rate limits, timeouts, and switching off non-essential features.',
      '<strong>Afterwards:</strong> load-test to find the next bottleneck and add alerts so you see it coming.'
    ],
    tradeoffs: ['Vertical scaling is quick but has a ceiling and a single point of failure; horizontal needs stateless apps.', 'Caching speeds up reads but adds staleness. Decide what can be a few seconds old.']
  },
  {
    id: 'incident',
    title: 'Production is down and you\'re on call',
    prompt: 'You get paged at 2 a.m.: the app is down. What do you do in the first 30 minutes?',
    clarify: ['Fully down or degraded? Which users and regions?'],
    steps: [
      '<strong>Acknowledge</strong> the page so others know someone\'s on it.',
      '<strong>Assess impact</strong> from dashboards and alerts.',
      '<strong>Communicate early</strong> in the incident channel or on the status page.',
      '<strong>Check what changed:</strong> recent deploys, config changes, infrastructure events, the cloud provider\'s status page.',
      '<strong>Mitigate before root-causing:</strong> roll back, fail over, restart, scale up, or turn off the broken feature.',
      '<strong>Escalate</strong> if you\'re stuck after a few minutes. That\'s expected of a new grad, not a weakness.',
      '<strong>Afterwards:</strong> a blameless postmortem with a timeline, root cause and action items.'
    ],
    tradeoffs: ['Restore service first; find the root cause second.', 'Mention improving runbooks and alerts afterwards. It shows ownership.']
  },
  {
    id: 'url',
    title: 'Design a URL shortener',
    prompt: 'Design a URL shortener like bit.ly.',
    clarify: ['How many new links a day, and how many redirects? (Reads usually far outnumber writes.)', 'Custom aliases? Expiration? Click analytics?'],
    steps: [
      '<strong>API:</strong> <code>POST /links {url}</code> → <code>{code}</code>; <code>GET /{code}</code> → 301/302 redirect.',
      '<strong>Codes:</strong> base62-encode a unique ID from a counter or ID service for short, collision-free codes, or hash and check for collisions.',
      '<strong>Storage:</strong> <code>code → url, owner, created_at, expires_at</code> with the code as the primary key; a key-value store also fits.',
      '<strong>Reads:</strong> cache popular codes in Redis or at the CDN, because redirects are read-heavy and latency-sensitive.',
      '<strong>Analytics:</strong> don\'t slow the redirect. Push click events to a queue and process them asynchronously.',
      '<strong>Scale:</strong> stateless API servers behind a load balancer, read replicas, shard by code if it gets huge.',
      '<strong>Abuse:</strong> rate-limit link creation and check URLs against malware lists.'
    ],
    tradeoffs: ['301 gets cached by browsers (less load, less analytics); 302 always hits you (accurate analytics).', 'Sequential codes are guessable. Add randomness if links should be private.']
  },
  {
    id: 'migrate',
    title: 'Move an on-prem app to the cloud',
    prompt: 'A client runs an internal Java app and its database on servers in their own data center. They want to move to the cloud. How would you approach it?',
    clarify: ['Why move: cost, scaling, retiring hardware? That decides the approach.', 'Compliance and data residency? Does anything have to stay on-prem?', 'What else depends on this app or its database?'],
    steps: [
      '<strong>Assess:</strong> inventory the app, database, integrations, traffic and pain points.',
      '<strong>Pick a strategy:</strong> rehost (lift and shift VMs), replatform (containerize, use a managed database) or refactor (redesign). Replatform is often the sweet spot.',
      '<strong>Containerize</strong> and run on OpenShift, which runs the same on-prem and in the cloud. That\'s IBM\'s hybrid model.',
      '<strong>Migrate data carefully:</strong> replicate to the cloud database, verify, cut over in a planned window, with a rollback plan.',
      '<strong>Connect securely:</strong> VPN or a dedicated link while some systems stay on-prem.',
      '<strong>Automate:</strong> Terraform for infrastructure and a CI/CD pipeline so environments are reproducible.',
      '<strong>Go in phases:</strong> start with a low-risk component, measure, continue.'
    ],
    tradeoffs: ['Lift-and-shift is fastest but carries old problems along; refactoring costs more but unlocks the cloud\'s benefits.', 'Hybrid is a legitimate end state, not a failure, especially in regulated industries.']
  },
  {
    id: 'uploads',
    title: 'Store and serve user uploads',
    prompt: 'Nurses need to upload certification documents to SurgiMatch. How would you store and serve them?',
    clarify: ['File sizes and volume? Who is allowed to see each file?', 'Do the documents contain personal information?'],
    steps: [
      '<strong>Object storage</strong>, not the database or a server\'s disk (containers are ephemeral).',
      '<strong>Direct upload</strong> from the browser with a short-lived pre-signed URL, so large files don\'t pass through your API.',
      '<strong>Metadata in Postgres:</strong> owner, filename, size, type, storage key, status.',
      '<strong>Validate:</strong> check type and size, scan for malware asynchronously, then mark the file available.',
      '<strong>Serve with authorization:</strong> generate short-lived signed download URLs only for users allowed to see the file.',
      '<strong>Protect:</strong> encryption at rest and in transit, lifecycle rules to archive or delete old files.'
    ],
    tradeoffs: ['Pre-signed URLs offload bandwidth but need tight expiry and permissions.', 'A CDN speeds up public files. Never put private documents behind a public cache.']
  },
  {
    id: 'aws-serverless', diagram: 'awsServerless',
    title: 'Build a serverless API on AWS',
    prompt: 'Design the backend for a mobile app\'s "saved trips" feature on AWS. Traffic is spiky and the team doesn\'t want to manage servers.',
    clarify: ['How many users, and how spiky? More reads or more writes?', 'What do we look trips up by: user, trip, date?', 'Our own logins, or social sign-in too?'],
    steps: [
      '<strong>Sign-in:</strong> a Cognito user pool handles sign-up and sign-in and issues JWTs.',
      '<strong>Front door:</strong> API Gateway (HTTP API) with a JWT authorizer, so requests without a valid token never reach your code.',
      '<strong>Logic:</strong> Lambda functions for the routes, each with its own IAM role that allows only the table actions it needs.',
      '<strong>Data:</strong> DynamoDB with partition key <code>userId</code> and sort key <code>tripId</code>, so "all trips for a user" is a single query.',
      '<strong>Slow work:</strong> emails and PDF exports go onto an SQS queue for a worker Lambda, so API responses stay fast.',
      '<strong>Files:</strong> photos upload straight from the app to S3 with pre-signed URLs.',
      '<strong>Operate:</strong> CloudWatch logs, metrics and alarms on errors and throttles; X-Ray traces across the calls.',
      '<strong>Deploy:</strong> SAM or CDK templates in Git, deployed by a pipeline to dev, staging and production.'
    ],
    tradeoffs: ['It scales to zero and costs almost nothing at low traffic; at constant high load, containers can be cheaper.', 'Cold starts add latency to some requests; provisioned concurrency fixes the hot paths, at a price.', 'DynamoDB is fast and hands-off, but its access patterns have to be designed up front; ad-hoc queries are hard.']
  },
  {
    id: 'aws-events', diagram: 'awsEvents',
    title: 'Process uploads with S3 events',
    prompt: 'Users upload invoices as PDFs. Each one has to be scanned, have its text extracted and its totals saved, and the user is notified when it\'s done. Design it on AWS.',
    clarify: ['How many files, how big, and is it bursty (month-end) or steady?', 'How quickly must results appear?', 'What should happen to a corrupt or unreadable file?'],
    steps: [
      '<strong>Upload:</strong> the app gets a pre-signed URL from the API, and the browser uploads straight to an S3 bucket.',
      '<strong>Event:</strong> S3 sends an ObjectCreated event to an SQS queue.',
      '<strong>Process:</strong> a Lambda reads the queue in batches, extracts the text (for example with Textract) and saves the totals to DynamoDB.',
      '<strong>Retries:</strong> a failed message reappears after the visibility timeout; after a few failures it moves to a dead-letter queue that has an alarm on it.',
      '<strong>Notify:</strong> the Lambda publishes to an SNS topic (or EventBridge), which emails the user and tells any other service that cares.',
      '<strong>Housekeeping:</strong> S3 lifecycle rules move originals to cheaper storage after 30 days.',
      '<strong>As it grows:</strong> once there are more steps (scan, extract, validate, approve), move the orchestration into Step Functions.'
    ],
    tradeoffs: ['The queue between S3 and Lambda absorbs month-end spikes and gives you retries and a DLQ; triggering Lambda straight from S3 is simpler but harder to control.', 'Processing must be idempotent, because standard SQS queues can deliver a message more than once.', 'Step Functions costs more per step but makes long, branching workflows visible and much easier to debug.']
  },
  {
    id: 'aws-3tier', diagram: 'aws3tier',
    title: 'Run a classic three-tier app on AWS',
    prompt: 'A company runs a Java web app and its PostgreSQL database on one server in its office. Move it to AWS so it keeps running if a data center fails.',
    clarify: ['How much traffic, and is it growing? Any rules about where the data lives?', 'Can the app run on several servers at once, or does it keep sessions in memory?', 'How much downtime and data loss is acceptable (RTO and RPO)?'],
    steps: [
      '<strong>Network:</strong> a VPC across two availability zones, each with a public and a private subnet.',
      '<strong>Entry:</strong> Route 53 points the domain at an Application Load Balancer in the public subnets, with an ACM certificate for HTTPS.',
      '<strong>App tier:</strong> the app runs in an Auto Scaling group of EC2 instances (or ECS on Fargate) in the private subnets of both zones, registered with the load balancer.',
      '<strong>Data tier:</strong> RDS for PostgreSQL with Multi-AZ, in the private subnets: a standby in the other zone takes over automatically.',
      '<strong>Locked down:</strong> the database\'s security group only accepts the app servers\' security group, and the app servers only accept the load balancer.',
      '<strong>Outbound:</strong> NAT gateways let the private servers download updates; no server has a public IP address.',
      '<strong>Secrets and logs:</strong> database credentials in Secrets Manager; logs, metrics and alarms in CloudWatch.',
      '<strong>Move the data:</strong> AWS Database Migration Service copies the office database and keeps it in sync until a planned cutover.'
    ],
    tradeoffs: ['Two zones survive a data center failure; surviving a whole region outage needs a second region and costs far more.', 'EC2 gives full control of the OS; Fargate removes server patching but needs the app in a container first.', 'Multi-AZ roughly doubles the database cost, but turns a failure into a minute or two of failover instead of an outage.']
  }
];

/* --------------------------------------------------------------------------
   Project deep dives: "walk me through it" + the follow-ups that come next
   -------------------------------------------------------------------------- */
PREP.projects = [
  {
    id: 'vetsez', name: 'VetsEZ', role: 'Full Stack Developer Intern · Jun 2026 – present', color: 'var(--c-vetsez)',
    stack: ['AWS', 'CI/CD', 'Government cloud', 'Full stack', 'Healthcare'],
    facts: ['Full-stack features for VA-facing healthcare software serving veterans across the U.S.', 'Hands-on with AWS and CI/CD pipelines in a government cloud environment', 'Remote, cross-functional team shipping iterative improvements to production'],
    note: 'Only share what\'s public. "I can\'t go into system details, but the process looks like this…" builds trust, which IBM lists as a core value.',
    walkthrough: 'At VetsEZ I\'m a full-stack developer intern on VA-facing healthcare software that veterans across the U.S. use. The stack is [frontend framework] on the front end and [backend language/framework] on the back end, running on AWS in a government cloud environment. A typical change for me is [example feature or fix]: I build it on a branch, write [kind of tests], and open a pull request. After review, our pipeline in [CI/CD tool] runs [stages: build, tests, scans], deploys to [dev/staging], and goes to production after [approval step]. The AWS services I touch most are [services], for [what each does]. The biggest thing I\'ve learned is how much discipline secure, repeatable deployments take when the users are veterans and the data is healthcare data.',
    followups: [
      ['Which AWS services have you worked with, and what does each do in your system?', 'Name only the ones you actually touched. One line on what each is, one on what your app uses it for. If you mostly see them through the pipeline, say so.'],
      ['Walk me through what happens from merge to production.', 'Trigger → build → tests → scans → artifact or image → deploy to a lower environment → checks and approval → production → verification. Mention who approves and roughly how long it takes.'],
      ['What\'s different about working in a government cloud?', 'Compliance (FedRAMP authorization, an Authority to Operate), strict least-privilege access, audit logging, change control and approvals, isolated environments, and rules for handling health data. Only claim what applies to your setup.'],
      ['How do you test your changes?', 'Unit tests for logic, integration tests for APIs and the database, maybe end-to-end UI tests, plus code review and testing in a lower environment first. Name your real tools.'],
      ['A deploy breaks production. What happens next?', 'Detect (alerts, monitoring) → roll back to the last good version → find the root cause → fix it with a test → write it up. Describe your team\'s actual process if you know it.'],
      ['How are secrets and configuration handled?', 'Per-environment config injected at deploy time; secrets from a managed store, never in code. If you don\'t know the exact tool, say how you\'d expect it to work and why.'],
      ['If you could improve one thing about the pipeline, what would it be?', 'Pick something real: faster feedback (parallel tests, caching), earlier security scanning, more automated tests, infrastructure as code. It shows you think like an owner.']
    ]
  },
  {
    id: 'railpark', name: 'Railpark Thoughts', role: 'Programming Intern · May 2024 – May 2026', color: 'var(--c-railpark)',
    stack: ['Google Cloud', 'Deployment', 'Scalability', 'Game dev'],
    facts: ['Two terms at a tech startup', 'Grew from game development and foundational research to deploying and managing projects on Google Cloud', 'Implemented frameworks to improve scalability and performance amid shifting priorities'],
    walkthrough: 'At Railpark Thoughts, a startup, I interned for two years: first on game development and foundational research, then deploying and managing projects on Google Cloud. One project I deployed was [project], which [what it does]. It ran on [GCP services, e.g. Cloud Run, Compute Engine, App Engine, Cloud Storage] and was deployed by [gcloud CLI, the console, or a CI pipeline]. I also implemented [framework or approach] to improve scalability and performance: the problem was [bottleneck], and afterwards [result, real numbers only]. The biggest lesson was learning a new platform quickly while priorities kept shifting.',
    followups: [
      ['Which Google Cloud services did you use, and why those?', 'Explain the choice, e.g. Cloud Run for containers that scale to zero, Compute Engine when you need a full VM. Map each to its AWS or IBM equivalent to show range.'],
      ['How did you deploy: manually or automated?', 'Be honest. If it was manual, say how you\'d automate it now: a pipeline that builds an image on merge and deploys with the CLI or Terraform.'],
      ['What did you do to improve scalability?', 'Bottleneck → how you found it (logs, profiling, load) → the change (caching, async work, restructuring, autoscaling) → how you verified it worked.'],
      ['How did you keep cloud costs under control?', 'Right-sizing, scaling to zero, budgets and alerts, deleting idle resources, managed services. If cost wasn\'t your job, say what you\'d watch.'],
      ['How do AWS and Google Cloud compare, from your experience?', 'Same concepts, different names (EC2 ↔ Compute Engine, S3 ↔ Cloud Storage). One real difference: Google Cloud organizes everything into projects, AWS into accounts.'],
      ['How did you go from game dev to cloud?', 'Your learning method: docs, small test deploys, asking teammates. This doubles as your "learn something fast" answer.']
    ]
  },
  {
    id: 'surgimatch', name: 'SurgiMatch', role: 'Team project · 2026', color: 'var(--c-isu)',
    stack: ['FastAPI', 'SQLModel', 'PostgreSQL', 'Alembic', 'React + TypeScript', 'Docker Compose'],
    facts: ['Matches qualified nurses to surgical staffing needs by location, skills and availability', 'You designed the surgery-assignment tables and link tables, and wrote Alembic migrations', 'You built CRUD logic and API routes for scheduled and customized surgery assignments, with assignment links and comments', 'You moved authorization checks for delete operations out of the CRUD layer', 'Ticketed PRs (S3-217, S3-240) with code review, including Copilot review suggestions', 'Redesign work: logos, colors, sidebar and footer'],
    walkthrough: 'SurgiMatch is a team web platform that matches qualified nurses to surgical staffing needs by location, skills and availability. It\'s a FastAPI backend with SQLModel and PostgreSQL, a React and TypeScript frontend, and the whole stack runs in Docker Compose. I owned the surgery-assignment side: I designed the assignment tables and the link tables that connect them to the rest of the model, wrote the Alembic migrations, and built the CRUD logic and API routes for scheduled and customized assignments, including assignment links and comments. I also moved the authorization checks for delete operations out of the CRUD layer. We worked in ticketed branches with pull requests and code review. The hardest part was [one specific challenge], which I solved by [how].',
    followups: [
      ['Walk me through the assignment data model.', 'Entities (surgery, nurse, hospital, assignment) and how they relate. A link table models many-to-many: one row per pairing, foreign keys to both sides, plus columns like status. Offer to sketch it.'],
      ['Why FastAPI?', 'Type hints drive request validation through Pydantic, it generates OpenAPI docs automatically, and it supports async. SQLModel lets the API and the database share one model definition.'],
      ['How do Alembic migrations work?', 'Each migration is a versioned script with upgrade and downgrade. Autogenerate diffs your models against the database; you review the script and it runs on deploy. Keep migrations backward-compatible for rolling deploys.'],
      ['Why move authorization checks out of the CRUD layer for deletes?', 'Give your actual reasoning, e.g. authorization belongs at the API boundary where you know who\'s calling, and the CRUD layer stays plain data access that\'s easier to reuse and test.'],
      ['How does authentication work?', 'Login returns a signed JWT, the frontend sends it with each request, and the backend verifies the signature and expiry. Passwords are hashed, never stored in plain text.'],
      ['How would you take it to production?', 'Use the "Deploy SurgiMatch to the cloud" scenario on the Design tab: registry, managed Postgres, OpenShift or Code Engine, secrets manager, CI pipeline, TLS, monitoring.'],
      ['How did your team work together?', 'Ticketed branches (S3-217, S3-240), pull requests, code review including automated Copilot suggestions you addressed, then merging to main.']
    ]
  },
  {
    id: 'coup', name: 'Coup V2', role: 'Team project · Iowa State SE 309', color: '#a855f7',
    stack: ['Java', 'Android', 'Volley', 'WebSockets', 'Spring Boot', 'JPA + MySQL', 'GitLab CI'],
    facts: ['Multiplayer Android game based on the card game Coup, built by a student team over a semester', 'Spring Boot backend with WebSocket endpoints for the game, lobbies, chat and friend chat, plus REST controllers', 'Spring Data JPA on MySQL; JUnit tests for game actions (coup, income, assassinate…)', 'GitLab CI: Maven build → Maven test → deploy (copy jar, restart a systemd service) → Android build → Android test', 'You owned frontend work: art, login/sign-up, settings, friends and messaging, custom themes'],
    walkthrough: 'Coup V2 is a multiplayer Android game based on the card game Coup, built by a student team over a semester. The Android app is Java: it calls the Spring Boot backend over HTTP with Volley, and uses WebSockets for anything real-time (the game itself, lobbies, chat and friend chat). The backend uses Spring Data JPA with MySQL. Our GitLab CI pipeline built and tested the backend with Maven, deployed the jar to our class server by restarting a systemd service, and built and tested the Android app. I owned frontend work: game art, login and sign-up, settings, friends and messaging, and custom themes. One problem I solved was [specific problem and how].',
    followups: [
      ['Why WebSockets instead of plain HTTP for the game?', 'HTTP is request/response, so clients would have to poll for every move. WebSockets keep a two-way connection open so the server can push moves, chat and lobby updates instantly.'],
      ['Walk me through your CI/CD pipeline.', 'Maven build → Maven test → deploy (move the jar, restart the systemd service) → Android build → Android test, triggered by pushes to main that touched those folders.'],
      ['What would you change to make that deploy production-ready?', 'Stopping and starting one service means downtime and no automatic rollback. Containerize it, add health checks, use rolling or blue-green deploys with versioned artifacts, and move credentials out of config files into a secrets store. This is a great "here\'s what I\'d improve" answer.'],
      ['How did the app handle a dropped connection?', 'Say what you actually did. If nothing, how you\'d do it: reconnect with backoff and re-fetch the current game state from the server.'],
      ['How was game state kept consistent between players?', 'The server should be the source of truth: clients send actions, the server validates turns and broadcasts the new state. Confirm how your team did it.'],
      ['How did you test it?', 'The backend has JUnit tests for game actions like coup, income and assassinate. Mention Espresso if you wrote Android UI tests.']
    ]
  },
  {
    id: 'sofu', name: 'Sofu Tofu Maker', role: 'Personal project', color: '#ec4899',
    stack: ['Swift', 'SwiftUI', 'ARKit', 'Vision', 'MediaPipe', 'Canvas', 'Electron', 'OBS'],
    facts: ['Face-sticker filter that follows your real expression, plus tap-to-plant 3D flags', 'iOS: ARKit TrueDepth face tracking, reading blend shapes (jawOpen, mouthSmile, eyeBlink, browInnerUp); Vision for photos and the back camera', 'Web version with MediaPipe Face Landmarker rendering to a canvas', 'Reaches FaceTime through OBS Virtual Camera, because a native virtual camera needs a paid Apple developer account', 'Electron desktop app with one-command OBS setup and reset'],
    walkthrough: 'Sofu Tofu Maker is a face-sticker filter I built that follows your real expression. The iOS app is SwiftUI with ARKit face tracking: I read blend shapes like jawOpen, mouthSmile and eyeBlink to classify the expression and pick a sticker, and use Apple\'s Vision framework for photos. I wanted it in FaceTime, but apps can only appear there through a macOS virtual camera, and building one needs a paid developer account. So I rebuilt the filter as a web page that runs MediaPipe\'s Face Landmarker and draws to a canvas, and used OBS, which ships a signed virtual camera, to feed it into FaceTime. Then I wrapped it in an Electron desktop app with a one-command OBS setup.',
    followups: [
      ['ARKit face tracking vs Vision: what\'s the difference?', 'ARKit (with TrueDepth) tracks a 3D face mesh live and gives blend-shape coefficients for expressions. Vision detects faces and 2D landmarks in any image or frame, on any camera, but expressions are rougher.'],
      ['How do blend shapes become an expression?', 'Each blend shape is a 0–1 value. Threshold or combine them: smile high → happy, jawOpen high → surprised, both eyes blinking → sleepy. Describe your actual rules.'],
      ['How does the web version keep up in real time?', 'A requestAnimationFrame loop runs the landmark model on each video frame (WebAssembly) and draws to a canvas. Mention any throttling or optimizations you made.'],
      ['Why not build the virtual camera yourself?', 'macOS camera extensions have to be signed with a paid Apple developer account. OBS already ships one, so reusing it was the pragmatic call. It shows judgment under constraints.'],
      ['What is Electron, and what are its tradeoffs?', 'Chromium plus Node.js packaged as a desktop app, so the same web code runs as a Mac app. The tradeoff is a larger download and more memory than a native app.']
    ]
  },
  {
    id: 'mazi', name: 'Mazi', role: 'Hackathon · Best AI Application', color: '#f59e0b',
    stack: ['AI', 'Hackathon', 'Team'],
    facts: ['Won Best AI Application at Iowa State\'s Applied AI hackathon', 'Helps large groups travel: AI builds a shared itinerary with events, hotels and flights'],
    walkthrough: 'Mazi won Best AI Application at Iowa State\'s Applied AI hackathon. It helps large groups plan a trip together: the AI builds a shared itinerary with events, hotels and flights. We built it with [frontend] and [backend], using [AI model or API] for generation. I built [your part]. In [time limit] we went from idea to demo by [how you scoped it].',
    followups: [
      ['How did you get structured itineraries out of the model?', 'Prompt for a fixed JSON schema (or use the API\'s structured output mode), validate the response, retry on bad output. Say what you actually did.'],
      ['What about made-up hotels or flights?', 'Models can hallucinate. Ground results in real data from search or booking APIs, validate them, and show sources. If you didn\'t, explain how you\'d fix it.'],
      ['How would you scale it for real users?', 'Cache common requests, queue long generations, rate-limit, track cost per request, store itineraries in a database, and run a stateless API behind a load balancer.'],
      ['How did the team split the work under time pressure?', 'Scope down to a demoable core, split by layer, integrate early, cut features late.']
    ]
  }
];

/* --------------------------------------------------------------------------
   Coding practice tracker (LeetCode slugs)
   -------------------------------------------------------------------------- */
PREP.problems = [
  { p: 'Hash map / set', items: [['Two Sum', 'two-sum', 'E'], ['Valid Anagram', 'valid-anagram', 'E'], ['Contains Duplicate', 'contains-duplicate', 'E'], ['Group Anagrams', 'group-anagrams', 'M'], ['Top K Frequent Elements', 'top-k-frequent-elements', 'M']] },
  { p: 'Two pointers', items: [['Valid Palindrome', 'valid-palindrome', 'E'], ['3Sum', '3sum', 'M'], ['Container With Most Water', 'container-with-most-water', 'M']] },
  { p: 'Sliding window', items: [['Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'E'], ['Longest Substring Without Repeating Characters', 'longest-substring-without-repeating-characters', 'M'], ['Longest Repeating Character Replacement', 'longest-repeating-character-replacement', 'M']] },
  { p: 'Stack', items: [['Valid Parentheses', 'valid-parentheses', 'E'], ['Min Stack', 'min-stack', 'M'], ['Daily Temperatures', 'daily-temperatures', 'M']] },
  { p: 'Binary search', items: [['Binary Search', 'binary-search', 'E'], ['Search in Rotated Sorted Array', 'search-in-rotated-sorted-array', 'M'], ['Koko Eating Bananas', 'koko-eating-bananas', 'M']] },
  { p: 'Linked list', items: [['Reverse Linked List', 'reverse-linked-list', 'E'], ['Merge Two Sorted Lists', 'merge-two-sorted-lists', 'E'], ['Linked List Cycle', 'linked-list-cycle', 'E']] },
  { p: 'Trees', items: [['Maximum Depth of Binary Tree', 'maximum-depth-of-binary-tree', 'E'], ['Invert Binary Tree', 'invert-binary-tree', 'E'], ['Binary Tree Level Order Traversal', 'binary-tree-level-order-traversal', 'M'], ['Validate Binary Search Tree', 'validate-binary-search-tree', 'M']] },
  { p: 'Graphs', items: [['Number of Islands', 'number-of-islands', 'M'], ['Course Schedule', 'course-schedule', 'M'], ['Clone Graph', 'clone-graph', 'M']] },
  { p: 'Heap & intervals', items: [['Kth Largest Element in an Array', 'kth-largest-element-in-an-array', 'M'], ['Merge Intervals', 'merge-intervals', 'M'], ['Insert Interval', 'insert-interval', 'M'], ['Non-overlapping Intervals', 'non-overlapping-intervals', 'M']] },
  { p: 'Dynamic programming', items: [['Climbing Stairs', 'climbing-stairs', 'E'], ['House Robber', 'house-robber', 'M'], ['Coin Change', 'coin-change', 'M']] },
  { p: 'SQL', items: [['Combine Two Tables', 'combine-two-tables', 'E'], ['Second Highest Salary', 'second-highest-salary', 'M'], ['Department Highest Salary', 'department-highest-salary', 'M']] }
];

/* --------------------------------------------------------------------------
   The non-technical questions technical rounds still ask
   -------------------------------------------------------------------------- */
PREP.talk = [
  ['Tell me about yourself.', 'Your pitch: present → past → why this role, 60–90 seconds.'],
  ['Why IBM?', 'Hybrid cloud matches your AWS + Google Cloud experience; regulated industries match VetsEZ; plus one thing specific to this team.'],
  ['Why cloud development?', 'You like owning the whole path from code to production, and you\'ve seen at VetsEZ how much the deployment side matters.'],
  ['Tell me about a technical challenge you overcame.', 'Sofu Tofu Maker (the FaceTime / virtual camera constraint) or a hard part of SurgiMatch\'s data model.'],
  ['Tell me about a time you learned a technology quickly.', 'Railpark: game dev → deploying on Google Cloud. Explain your learning method.'],
  ['Tell me about disagreeing on a technical decision.', 'A code review or design debate on SurgiMatch or Coup V2: disagree about the work, not the person, and end with what you agreed on.'],
  ['Tell me about a bug you\'re proud of fixing.', 'Pick a real one: symptom → how you narrowed it down → root cause → fix → what you added so it can\'t come back.'],
  ['What would you do if a client asked something you couldn\'t answer?', '"I\'d say I don\'t know yet, find out, and follow up by a specific time." Trust is an IBM core value.'],
  ['How do you stay current?', 'Daily LeetCode, side projects (Sofu Tofu, this site), hackathons, and one thing you learned recently.']
];

PREP.defaults = {
  pitch: 'I\'m Billy Dang, a Software Engineering grad from Iowa State, and I\'m most interested in the path from code to cloud. Right now I\'m a full-stack developer intern at VetsEZ, building features for VA healthcare software used by veterans across the country, working with AWS and CI/CD pipelines in a government cloud environment. Before that I spent two years at Railpark Thoughts, a startup where I started in game development and grew into deploying and managing projects on Google Cloud. On the side I build things end to end: on SurgiMatch I designed the surgery-assignment data model and APIs with FastAPI and PostgreSQL, and my team won Best AI Application at Iowa State\'s Applied AI hackathon. I\'m looking for a cloud developer role where I can go deeper on containers, pipelines and reliability, and IBM\'s focus on hybrid cloud is exactly where I want to do that.',
  whyibm: 'Three reasons. First, IBM\'s focus on hybrid cloud matches how I\'ve actually worked: I deployed on Google Cloud at Railpark and I work on AWS now at VetsEZ, so a platform like OpenShift that runs the same way everywhere makes a lot of sense to me. Second, IBM builds for regulated industries like government, healthcare and banking, which is exactly the environment I\'m in at VetsEZ, where security and repeatable deployments aren\'t optional. Third, [something specific about this team or the job posting].'
};
