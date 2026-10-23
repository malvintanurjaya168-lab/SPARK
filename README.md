SPARK - Student Progress & Reward Keeper
SPARK is a web application for student discipline and reward point management designed for President High School. It assists administrators and student affairs staff in recording, validating, and monitoring student reward and violation points in real time.

1. Prerequisites & Tested Versions
•	Docker Desktop: v24.0.0 or newer
•	Docker Engine: Tested on Windows containers
•	Git: v2.x

2. Setup & Configuration
1. Clone the Repository
git clone https://github.com/malvintanurjaya168-lab/SPARK.git
cd SPARK
git checkout chore/dockerize-project

2. Configure Environment Variables (.env)
Create a .env file in the root directory of the project with your exact Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL="https://lgirsfcgaasawsmruqrm.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_88z9G3AdSiRhXJuiFUKAow_8vnw4GyD"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_5y60BxWgK0zE2G12a3dmQQ_YZYTiRC6"

3. Build & Run with Docker
1. Build the Docker Image
docker build -t isapmd/spark:week6 .

2. Run the Container
docker run -d --name spark-container -p 3000:3000 --env-file .env isapmd/spark:week6

4. Application Details & Access
•	App URL: http://localhost:3000
•	Host Port Mapping: 3000 (Host) -> 3000 (Container)
•	Base Image: node:20-alpine

5. Verification & Health Checks
1. Check Container Status:
docker ps

2. Verify Application Functionality:
•	Open http://localhost:3000 in your browser.
•	Navigate to the login page and click the Login / Masuk button.
•	Verify that you successfully reach the Administrator Dashboard and that the Database System widget displays an Active status.

6. Logs & Inspection
# View container logs
docker logs spark-container

# Follow logs in real-time
docker logs -f spark-container

7. Stop & Cleanup
docker rm -f spark-container

8. Troubleshooting & Known Limitations
•	Hydration Error (Red Overlay): Browser extensions injecting custom attributes into HTML tags before React completes loading. Close the error overlay by clicking the 'X' button or use Incognito mode.
•	Login Error (Unexpected token '<'): NEXT_PUBLIC_SUPABASE_* variables were not baked into the Next.js client bundle during build. Ensure public Supabase environment variables are declared inside the Dockerfile prior to running npm run build/dev.
•	GitHub Push Protection Block: Accidentally committing secret keys directly inside Dockerfile. Exclude secret keys from Dockerfile, keep them in local .env files, and leave only NEXT_PUBLIC_* variables for build instructions.
