import { auth } from "@/auth"
import {Octokit} from "octokit"
import {prisma} from "@/lib/prisma"
export async function POST(request: Request) {
          const session =await auth()
          if(!session?.user?.id){
                    return Response.json({
                              error:"unauthorized"
                    },{status:401})
          }
          const user = await prisma.user.findFirst({
                    where:{id:session.user?.id},
                    include:{accounts:true}
          })

          const githubAccessToken=user?.accounts.find((acc) => acc.provider==="github")?.access_token

          if(!githubAccessToken){
                    return Response.json({
                              success:false,
                              error:"no github access token"
                    },{status:404})
          }

          const {owner,pull_number,repo} = await request.json()
          const octokit=new Octokit({auth:githubAccessToken})
          const pullReq=await octokit.rest.pulls.get({
                    owner,
                    pull_number,
                    repo
          })

          if(!pullReq){
                    return Response.json({
                              success:false,
                              error:"no pullReq found"
                    },{status:404})
          }

          return Response.json({
                    success:true,
                    data:pullReq.data
          },{status:200})
}