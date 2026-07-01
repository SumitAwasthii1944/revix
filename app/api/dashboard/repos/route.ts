import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const repos = await prisma.repository.findMany({
      where: { userId: user.id },
    });

    if (!repos || repos.length === 0) {
      return Response.json(
        { success: false, data: "No repos found" },
        { status: 404 }
      );
    }

    return Response.json(
      { success: true, data: repos },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/dashboard/repos:", error);
    return Response.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
