import {
  PrismaClient,
  User,
  Role,
  courses,
  CourseEnrollment,
  Prisma
} from "@prisma/client";

// Types for function parameters
export type CreateUserParams = {
  id: string;
  age: number;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  verificationCode?: string;
  verificationCodeExpiers: Date;
  encodedimagedata?: string;
  email: string;
  image?: string;
  role?: Role;
  isVerified?: boolean;
};

type UpdateUserParams = Partial<CreateUserParams>;

type CreateCourseParams = {
  id: string;
  name: string;
  category?: string;
};

type UpdateCourseParams = Partial<CreateCourseParams>;

type EnrollUserParams = {
  userId: string;
  courseId: string;
  role?: Role;
};

/**
 * Database utility class that encapsulates all Prisma operations
 * for the application. Provides CRUD operations and specialized queries
 * for users, courses, and enrollments.
 */
export class Database {
  private prisma: PrismaClient; // turn to services

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Close the database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }

  /**
   * Connect to the database
   */
  async connect() {
    await this.prisma.$connect();
  }

  // #region User Operations

  /**
   * Create a new user
   * @param userData User data to create the user with
   * @returns The created user
   */
  async createUser(userData: CreateUserParams): Promise<User> {
    return this.prisma.user.create({
      data: userData
    });
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns The user or null if not found
   */
  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Get a user by email
   * @param email User email
   * @returns The user or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Get all users with optional filtering by role
   * @param role Optional role to filter by
   * @returns Array of users
   */
  async getAllUsers(role?: Role): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        age: true,
        encodedimagedata: true,
        role: true
      }
      // orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all users with optional filtering by role
   * @param role Optional role to filter by
   * @returns Array of users
   */
  async getAllUsersForAttendance(): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
      where: { role: "student" },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        encodedimagedata: true
      }
    });
  }

  /**
   * Update a user
   * @param id User ID
   * @param userData User data to update
   * @returns The updated user
   */
  async updateUser(id: string, userData: UpdateUserParams): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: userData
    });
  }

  /**
   * Delete a user by ID
   * @param id User ID
   * @returns The deleted user
   */
  async deleteUser(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  /**
   * Verify a user's email
   * @param email User email
   * @returns The user or null if not found
   */
  async getUserByVerificationCode(
    verificationCode: string
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { verificationCode }
    });
  }

  /**
   * getalluserswithoutencodedimagedata
   * @returns Array of users
   */
  async getAllUsersWithoutEncodedImageData(): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
      where: { encodedimagedata: null, role: "student" }, //encodedimagedata: null ,
      select: {
        id: true,
        image: true
      }
    });
  }

  /**
   * Search users by name (first or last)
   * @param searchTerm Search term to look for in firstname or lastname
   * @returns Array of matching users
   */
  async searchUsers(searchTerm: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { firstname: { contains: searchTerm, mode: "insensitive" } },
          { lastname: { contains: searchTerm, mode: "insensitive" } }
        ]
      }
    });
  }

  async isLicenseplate(licenseplate: string): Promise<Partial<User> | null> {
    const user = await this.prisma.user.findUnique({
      where: { licenseplate },
      select: {
        firstname: true,
        lastname: true
      }
    });
    return user;
  }

  // #endregion

  // #region Course Operations

  /**
   * Create a new course
   * @param courseData Course data
   * @returns The created course
   */
  async createCourse(courseData: CreateCourseParams): Promise<courses> {
    return this.prisma.courses.create({
      data: courseData
    });
  }

  /**
   * Get a course by ID
   * @param id Course ID
   * @returns The course or null if not found
   */
  async getCourseById(id: string): Promise<courses | null> {
    return this.prisma.courses.findUnique({
      where: { id }
    });
  }

  /**
   * Get a course by name
   * @param name Course name
   * @returns The course or null if not found
   */
  async getCourseByName(name: string): Promise<courses | null> {
    return this.prisma.courses.findUnique({
      where: { name }
    });
  }

  /**
   * Get all courses with optional category filtering
   * @param category Optional category to filter by
   * @returns Array of courses
   */
  async getAllCourses(category?: string): Promise<courses[]> {
    return this.prisma.courses.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Update a course
   * @param id Course ID
   * @param courseData Course data to update
   * @returns The updated course
   */
  async updateCourse(
    id: string,
    courseData: UpdateCourseParams
  ): Promise<courses> {
    return this.prisma.courses.update({
      where: { id },
      data: courseData
    });
  }

  /**
   * Delete a course by ID
   * @param id Course ID
   * @returns The deleted course
   */
  async deleteCourse(id: string): Promise<courses> {
    return this.prisma.courses.delete({
      where: { id }
    });
  }

  /**
   * Search courses by name
   * @param searchTerm Search term to look for in course name
   * @returns Array of matching courses
   */
  async searchCourses(searchTerm: string): Promise<courses[]> {
    return this.prisma.courses.findMany({
      where: {
        name: { contains: searchTerm, mode: "insensitive" }
      }
    });
  }

  // #endregion

  // #region Enrollment Operations

  /**
   * Enroll a user in a course with a specific role
   * @param enrollmentData Enrollment data
   * @returns The created enrollment
   */
  async enrollUserInCourse(
    enrollmentData: EnrollUserParams
  ): Promise<CourseEnrollment> {
    if (!enrollmentData.role) {
      enrollmentData.role = "student";
    }
    return this.prisma.courseEnrollment.create({
      data: {
        userId: enrollmentData.userId,
        courseId: enrollmentData.courseId,
        role: enrollmentData.role
      }
    });
  }

  /**
   * Remove a user's enrollment from a course
   * @param userId User ID
   * @param courseId Course ID
   * @returns The deleted enrollment
   */
  async unenrollUserFromCourse(
    userId: string,
    courseId: string
  ): Promise<CourseEnrollment> {
    return this.prisma.courseEnrollment.delete({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });
  }

  /**
   * Get all courses a specific user is enrolled in
   * @param userId User ID
   * @param role Optional role to filter by
   * @returns Array of courses with enrollment details
   */
  async getUserCourses(
    userId: string,
    role?: Role
  ): Promise<(CourseEnrollment & { course: courses })[]> {
    return this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        ...(role && { role })
      },
      include: {
        course: true
      },
      orderBy: {
        joinedAt: "desc"
      }
    });
  }

  /**
   * Get all users enrolled in a specific course
   * @param courseId Course ID
   * @param role Optional role to filter by
   * @returns Array of users with enrollment details
   */
  async getCourseEnrollments(
    courseId: string,
    role?: Role
  ): Promise<(CourseEnrollment & { user: User })[]> {
    return this.prisma.courseEnrollment.findMany({
      where: {
        courseId,
        ...(role && { role })
      },
      include: {
        user: true
      },
      orderBy: {
        joinedAt: "desc"
      }
    });
  }

  /**
   * Check if a user is enrolled in a specific course
   * @param userId User ID
   * @param courseId Course ID
   * @returns Enrollment or null if not enrolled
   */
  async isUserEnrolledInCourse(
    userId: string,
    courseId: string
  ): Promise<CourseEnrollment | null> {
    return this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });
  }

  /**
   * Get enrollment counts for a course by role
   * @param courseId Course ID
   * @returns Object with counts for each role
   */
  async getCourseEnrollmentStats(
    courseId: string
  ): Promise<{ students: number; doctors: number; assistants: number }> {
    const stats = await this.prisma.$transaction([
      this.prisma.courseEnrollment.count({
        where: { courseId, role: "student" }
      }),
      this.prisma.courseEnrollment.count({
        where: { courseId, role: "doctor" }
      }),
      this.prisma.courseEnrollment.count({
        where: { courseId, role: "assistant" }
      })
    ]);

    return {
      students: stats[0],
      doctors: stats[1],
      assistants: stats[2]
    };
  }

  // #endregion

  // #region Advanced Queries

  /**
   * Get courses where a user has a specific role
   * For example: Get all courses where the user is a doctor
   * @param userId User ID
   * @param role Role to filter by
   * @returns Array of courses
   */
  async getCoursesWhereUserHasRole(
    userId: string,
    role: Role
  ): Promise<courses[]> {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        role
      },
      select: {
        course: true
      }
    });

    return enrollments.map((enrollment) => enrollment.course);
  }

  /**
   * Get all users with a specific role in a course
   * For example: Get all doctors for a specific course
   * @param courseId Course ID
   * @param role Role to filter by
   * @returns Array of users
   */
  async getUsersWithRoleInCourse(
    courseId: string,
    role: Role
  ): Promise<Partial<User>[]> {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        courseId,
        role
      },
      select: {
        user: true
      }
    });

    const users = enrollments.map((enrollment) => {
      return {
        firstname: enrollment.user.firstname,
        lastname: enrollment.user.lastname,
        encodedimagedata: enrollment.user.encodedimagedata,
        id: enrollment.user.id
      };
    }); // Array of users
    return users;
  }

  /**
   * Get course statistics including enrollment counts
   * @returns Array of courses with enrollment statistics
   */
  async getCourseStatistics(): Promise<
    {
      id: string;
      name: string;
      studentCount: number;
      doctorCount: number;
      assistantCount: number;
    }[]
  > {
    const courses = await this.prisma.courses.findMany();
    const result = [];

    for (const course of courses) {
      const stats = await this.getCourseEnrollmentStats(course.id);
      result.push({
        id: course.id,
        name: course.name,
        studentCount: stats.students,
        doctorCount: stats.doctors,
        assistantCount: stats.assistants
      });
    }

    return result;
  }

  /**
   * Find users who are enrolled in multiple specific courses
   * @param courseIds Array of course IDs
   * @returns Array of users with counts of how many of the specified courses they're enrolled in
   */
  async findUsersInMultipleCourses(
    courseIds: string[]
  ): Promise<{ user: User; courseCount: number }[]> {
    // This is a more complex query that counts enrollments per user for the specified courses
    const enrollments = await this.prisma.courseEnrollment.groupBy({
      by: ["userId"],
      where: {
        courseId: {
          in: courseIds
        }
      },
      _count: {
        courseId: true
      }
    });

    const result = [];
    for (const item of enrollments) {
      if (item._count.courseId > 0) {
        const user = await this.getUserById(item.userId);
        if (user) {
          result.push({
            user,
            courseCount: item._count.courseId
          });
        }
      }
    }

    // Sort by users in most courses first
    return result.sort((a, b) => b.courseCount - a.courseCount);
  }

  // #endregion

  // #region Hall and Camera Operations

  async createHall(name: string): Promise<any> {
    return this.prisma.hall.create({
      data: {
        name
      }
    });
  }

  async createCamera(
    hallname: string,
    username: string,
    password: string,
    camera_ip: string
  ): Promise<any> {
    return this.prisma.camera.create({
      data: {
        hallname,
        username,
        password,
        camera_ip
      }
    });
  }

  async getHalls(): Promise<any> {
    return this.prisma.hall.findMany();
  }

  async getCameras(): Promise<any> {
    return this.prisma.camera.findMany();
  }

  async getCameraById(id: string): Promise<any> {
    return this.prisma.camera.findUnique({
      where: {
        id
      }
    });
  }

  async getCamerasByHallName(hallname: string): Promise<any> {
    return this.prisma.camera.findMany({
      where: {
        hallname: hallname.toUpperCase()
      }
    });
  }

  async updateCamera(id: string, cameraData: any): Promise<any> {
    return this.prisma.camera.update({
      where: {
        id
      },
      data: cameraData
    });
  }

  async deleteCamera(id: string): Promise<any> {
    return this.prisma.camera.delete({
      where: {
        id
      }
    });
  }
}
