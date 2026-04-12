# General Bug Fixing Guide for SkipQ

Follow this standard procedure to resolve any issue across the SkipQ repository.

## 1. Local Development & Testing
1. **Pull the latest code**: Ensure your workspace `Project_WS_Bug_Fixes` is on the `dev` branch and pull the latest changes.
   ```bash
   git pull origin dev
   ```
2. **Implement the Fix**: Make the required changes in the `Backend` or `Frontend` codebase. Ensure the fix specifically addresses the bug without introducing regressions.
3. **Local Restart & Verification**: 
   - Backend: run `python manage.py test` and restart with `python manage.py runserver`
   - Frontend: run `npm run dev`
   - Test the specific edge case on your local machine before pushing.

## 2. Version Control (Pushing to Dev)
1. **Stage your changes safely**: Review your `git status` and add only the relevant files.
   ```bash
   git add <modified_files>
   ```
2. **Commit with a descriptive message**: Always reference the issue number.
   ```bash
   git commit -m "Fix: Resolve issue #X - <Short description>"
   ```
3. **Push to the `dev` branch**:
   ```bash
   git push origin dev
   ```

## 3. Remote Server Deployment
After the code is merged into `dev` on GitHub, it must be pulled to the remote staging server to be visible to stakeholders.
1. **SSH into the deployment server**:
   ```bash
   ssh commit_and_conquer@172.27.16.252
   # Password: i53C4fza
   ```
2. **Navigate to the project directory**:
   ```bash
   cd SkipQ
   ```
3. **Pull the latest changes**:
   ```bash
   git pull origin dev
   ```
4. *Note: Background services (like Gunicorn or PM2) will serve the updated code. Rebuild frontend assets if necessary (`npm run build`).*

## 4. Live Verification
1. Open the live deployment URL (`http://172.27.16.252:3000`).
2. Replicate the user flow that caused the bug.
3. Verify that the changes are visible and the bug has been successfully resolved in the staging environment.
