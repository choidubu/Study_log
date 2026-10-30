package com.studylog.studylog;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/study-records")
public class StudyRecordController {

    private final JdbcTemplate jdbcTemplate;

    public StudyRecordController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 공부 기록 저장
    @PostMapping
    public Map<String, Object> saveRecord(
            @RequestBody Map<String, Object> request) {

        String label = (String) request.get("label");
        Integer seconds = (Integer) request.get("seconds");

        jdbcTemplate.update(
                "INSERT INTO study_records (label, seconds) VALUES (?, ?)",
                label,
                seconds
        );

        return Map.of(
                "message", "공부 기록이 저장되었습니다.",
                "label", label,
                "seconds", seconds
        );
    }

    // 공부 기록 조회
    @GetMapping
    public List<Map<String, Object>> getRecords() {

        return jdbcTemplate.queryForList(
                "SELECT id, label, seconds, studied_at " +
                "FROM study_records ORDER BY id DESC"
        );
    }

    // 공부 기록 삭제
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteRecord(@PathVariable Long id) {

        int deletedRows = jdbcTemplate.update(
                "DELETE FROM study_records WHERE id = ?",
                id
        );

        if (deletedRows == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "삭제할 기록을 찾을 수 없습니다."
            );
        }

        return Map.of(
                "message",
                "공부 기록이 삭제되었습니다."
        );
    }
}
