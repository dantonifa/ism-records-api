export default function StudentTable({ students }) {
  return (
    <div className="student-table-wrap">
      <table className="student-table">
        <thead>
          <tr>
            <th scope="col">Student ID</th>
            <th scope="col">Name</th>
            <th scope="col">Grade</th>
            <th scope="col">Section</th>
            <th scope="col">Year</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id || student.studentId}>
              <td>{student.studentId}</td>
              <td>
                {student.firstName} {student.lastName}
              </td>
              <td>{student.gradeLevel}</td>
              <td>{student.section}</td>
              <td>{student.year}</td>
              <td>
                <a href={`/students/${student.studentId}`}>View</a>
                {" · "}
                <a href={`/students/${student.studentId}/edit`}>Edit</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
