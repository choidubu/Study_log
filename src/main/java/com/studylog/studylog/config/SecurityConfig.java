package com.studylog.studylog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // DB에서 회원 정보를 조회
    @Bean
    public UserDetailsService userDetailsService(JdbcTemplate jdbcTemplate) {
        return email -> {
            try {
                return jdbcTemplate.queryForObject(
                    "SELECT email, password FROM users WHERE email = ?",
                    (rs, rowNum) -> User.withUsername(rs.getString("email"))
                        .password(rs.getString("password"))
                        .roles("USER")
                        .build(),
                    email
                );
            } catch (EmptyResultDataAccessException e) {
                throw new UsernameNotFoundException("가입된 회원이 없습니다.", e);
            }
        };
    }

    // 로그인 인증 관리자
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // 로그인 상태를 세션에 저장
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            SecurityContextRepository securityContextRepository) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .securityContext(context ->
                context.securityContextRepository(securityContextRepository)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/css/**",
                    "/js/**",
                    "/assets/**",
                    "/study_log_favicon.png",
                    "/api/auth/**"
                ).permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
